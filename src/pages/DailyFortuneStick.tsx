import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import DesktopLayout from "@/components/DesktopLayout";
import SEO from "@/components/SEO";
import {
  drawRandomStick,
  findStickByNumber,
  LEVEL_COLOR,
  LEVEL_EMOJI,
  type FortuneStick,
  type StickLevel,
} from "@/data/fortuneSticks";

interface DrawResult {
  id: string;
  stickNumber: number;
  level: StickLevel;
  title: string;
  poem: string;
  interpretation: string;
  actionTip: string;
  energyScore: number;
}

type DrawState = "idle" | "shaking" | "result";

const DailyFortuneStick = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, promptLogin } = useAuth();

  const [state, setState] = useState<DrawState>("idle");
  const [result, setResult] = useState<DrawResult | null>(null);
  const [focus, setFocus] = useState("");
  const [loadingToday, setLoadingToday] = useState(true);

  // 加载今日已有抽签
  useEffect(() => {
    if (!user) {
      setLoadingToday(false);
      return;
    }
    (async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const { data } = await supabase
          .from("fortune_stick_draws")
          .select("*")
          .eq("user_id", user.id)
          .eq("draw_date", today)
          .maybeSingle();
        if (data) {
          setResult({
            id: data.id,
            stickNumber: data.stick_number,
            level: data.stick_level as StickLevel,
            title: data.stick_title,
            poem: data.stick_poem,
            interpretation: data.interpretation,
            actionTip: data.action_tip,
            energyScore: data.energy_score,
          });
          setState("result");
        }
      } catch (e) {
        console.error("load today fortune err", e);
      } finally {
        setLoadingToday(false);
      }
    })();
  }, [user]);

  const handleDraw = useCallback(async () => {
    if (!user) {
      promptLogin("登录后即可求今日灵签 ✨");
      return;
    }
    setState("shaking");
    const stick: FortuneStick = drawRandomStick();
    // 稍等让动画播一会
    await new Promise((r) => setTimeout(r, 1400));
    try {
      const { data, error } = await supabase.functions.invoke("daily-fortune-stick", {
        body: {
          stickNumber: stick.number,
          level: stick.level,
          title: stick.title,
          poem: stick.poem,
          hint: stick.hint,
          focus: focus.trim() || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({
        id: data.id,
        stickNumber: data.stickNumber,
        level: data.level,
        title: data.title,
        poem: data.poem,
        interpretation: data.interpretation,
        actionTip: data.actionTip,
        energyScore: data.energyScore,
      });
      setState("result");
    } catch (e: any) {
      console.error("draw fortune err", e);
      toast.error(e?.message || "求签失败，请稍后再试");
      setState("idle");
    }
  }, [user, focus, promptLogin]);

  if (loadingToday) {
    return (
      <div className="min-h-screen bg-gradient-calm flex items-center justify-center">
        <div className="animate-pulse text-sm text-muted-foreground">加载中…</div>
      </div>
    );
  }

  return (
    <DesktopLayout>
      <div className="min-h-screen bg-gradient-calm pb-24 md:pb-8">
        <SEO title="今日求签 — 心灵密语" description="抽一支今日灵签，AI 为你做现代化解签。" />

        <div className="px-6 pt-14 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="rounded-full bg-card p-2 shadow-card"
            >
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">今日求签</h1>
              <p className="text-xs text-muted-foreground">
                诚心默念心事，再轻轻摇出今日之签
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-6 mt-6"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  animate={{ rotate: [0, -3, 3, -2, 2, 0], y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-6 flex h-56 w-28 items-end justify-center rounded-t-full rounded-b-md bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 shadow-xl"
                >
                  <div className="mb-6 w-[2px] h-32 bg-amber-900/40 rounded-full" />
                </motion.div>
                <p className="text-sm text-muted-foreground mb-5 max-w-[280px] leading-relaxed">
                  把今日最挂念的事放在心上，深呼吸 3 次，再轻轻摇签。
                </p>

                <textarea
                  value={focus}
                  onChange={(e) => setFocus(e.target.value.slice(0, 50))}
                  placeholder="（可选）写下今日心事，让解签更贴近你"
                  className="mb-5 w-full max-w-md rounded-2xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground/70 resize-none shadow-card focus:outline-none focus:ring-2 focus:ring-amber-300/60"
                  rows={2}
                />

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDraw}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg"
                >
                  <Sparkles className="h-4 w-4" /> 摇签
                </motion.button>
              </div>
            </motion.div>
          )}

          {state === "shaking" && (
            <motion.div
              key="shaking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 mt-6"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  animate={{ rotate: [-15, 15, -15], y: [0, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-6 flex h-56 w-28 items-end justify-center rounded-t-full rounded-b-md bg-gradient-to-b from-amber-200 via-amber-300 to-amber-600 shadow-xl"
                >
                  <div className="mb-6 w-[2px] h-32 bg-amber-900/50 rounded-full" />
                </motion.div>
                <p className="text-sm text-muted-foreground animate-pulse">
                  签筒沙沙作响…AI 正在解签
                </p>
              </div>
            </motion.div>
          )}

          {state === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-6 mt-2"
            >
              {/* 签头 */}
              <div className="rounded-2xl bg-card p-5 shadow-card mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-rose-400 text-3xl shadow-md">
                    {LEVEL_EMOJI[result.level]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground tracking-widest">
                        第 {result.stickNumber} 签
                      </span>
                      <span
                        className={`rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold ${LEVEL_COLOR[result.level]}`}
                      >
                        {result.level}
                      </span>
                    </div>
                    <h2 className="font-display text-lg font-bold text-foreground mt-0.5">
                      {result.title}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      能量 {result.energyScore}/5
                    </p>
                  </div>
                </div>
              </div>

              {/* 签诗 */}
              <div className="rounded-2xl bg-gradient-to-br from-amber-50/60 to-rose-50/60 dark:from-amber-950/30 dark:to-rose-950/30 p-5 shadow-card mb-4 border border-amber-200/40 dark:border-amber-800/30">
                <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-3">
                  签诗
                </h3>
                <p
                  className="font-display text-base leading-loose text-foreground whitespace-pre-line text-center"
                  style={{ letterSpacing: "0.06em" }}
                >
                  {result.poem}
                </p>
              </div>

              {/* 解签 */}
              <div className="rounded-2xl bg-card p-5 shadow-card mb-4">
                <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
                  现代解签
                </h3>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                  {result.interpretation}
                </p>
                {result.actionTip && (
                  <div className="mt-4 rounded-xl bg-muted/60 p-3">
                    <p className="text-xs text-muted-foreground mb-1">今日小行动</p>
                    <p className="text-sm text-foreground">💡 {result.actionTip}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/")}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-card py-3 text-sm font-medium text-foreground shadow-card"
                >
                  <RotateCcw className="h-4 w-4" /> 回到首页
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    navigate(`/chat?agent=xinggui`, {
                      state: {
                        fortuneStick: {
                          stickNumber: result.stickNumber,
                          level: result.level,
                          title: result.title,
                          poem: result.poem,
                          interpretation: result.interpretation,
                          actionTip: result.actionTip,
                        },
                      },
                    })
                  }
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 py-3 text-sm font-semibold text-white shadow-lg"
                >
                  <Sparkles className="h-4 w-4" /> 找星轨细聊
                </motion.button>
              </div>

              <p className="mt-4 text-center text-[11px] text-muted-foreground">
                每日一签，明日 0 点重置
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav />
      </div>
    </DesktopLayout>
  );
};

export default DailyFortuneStick;