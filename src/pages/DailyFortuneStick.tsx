import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import DesktopLayout from "@/components/DesktopLayout";
import SEO from "@/components/SEO";
import FortuneRippleScene from "@/components/FortuneRippleScene";
import {
  drawRandomStick,
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
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,hsl(35_18%_11%)_0%,hsl(0_0%_5%)_60%)]">
        <div className="animate-pulse text-sm text-muted-foreground">加载中…</div>
      </div>
    );
  }

  return (
    <DesktopLayout>
      <div className="min-h-screen pb-24 md:pb-8 bg-[radial-gradient(ellipse_at_top,hsl(200_12%_9%)_0%,hsl(0_0%_5%)_58%)]">
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
              <p className="text-xs text-muted-foreground mt-0.5">
                把挂念轻轻放下，等水面静下来
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
              className="px-6 mt-4"
            >
              <div className="mx-auto max-w-md flex flex-col items-center text-center">
                <div className="relative w-full rounded-3xl border border-[#7A9BA8]/15 bg-[linear-gradient(180deg,rgba(122,155,168,0.06)_0%,transparent_100%)] px-4 pb-8 pt-4 overflow-hidden">
                  <FortuneRippleScene />
                </div>

                <p className="text-sm text-foreground/80 mb-6 max-w-[300px] leading-relaxed font-light tracking-wide">
                  把今日最挂念的事轻轻放下，
                  <br />
                  深呼吸 3 次，等今日的那一签浮现。
                </p>

                <textarea
                  value={focus}
                  onChange={(e) => setFocus(e.target.value.slice(0, 50))}
                  placeholder="（可选）写下今日心事，让解签更贴近你"
                  className="mb-6 w-full rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none shadow-card focus:outline-none focus:ring-1 focus:ring-primary/40"
                  rows={2}
                />

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={handleDraw}
                  className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/90 px-10 py-3.5 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-8px_hsla(42,53%,54%,0.55)] transition-colors hover:bg-primary"
                >
                  <Sparkles className="h-4 w-4 opacity-90" /> 触水求签
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
              className="px-6 mt-4"
            >
              <div className="flex flex-col items-center text-center">
                <FortuneRippleScene shaking />
                <p className="text-sm text-muted-foreground animate-pulse mt-2 font-light tracking-wide">
                  瓣已落入水中…水面渐静，正在为你解签
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
              <div className="rounded-2xl bg-card p-5 shadow-card mb-4 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-300/20 to-rose-400/20 blur-2xl" />
                <div className="flex items-center gap-4 relative">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-300 to-rose-400 blur-md opacity-60" />
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-rose-400 text-3xl shadow-md ring-2 ring-amber-200/60 dark:ring-amber-300/30">
                      {LEVEL_EMOJI[result.level]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground tracking-widest">
                        第 {result.stickNumber} 签
                      </span>
                      <span
                        className={`rounded-md border border-amber-400/40 bg-gradient-to-br from-amber-100/80 to-rose-100/60 dark:from-amber-900/40 dark:to-rose-900/30 px-2 py-0.5 text-[10px] font-semibold tracking-wider ${LEVEL_COLOR[result.level]}`}
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

              {/* 签诗 —— 古卷签纸风 */}
              <div
                className="relative rounded-2xl p-6 pt-7 mb-4 overflow-hidden border border-amber-700/40 dark:border-amber-500/30 shadow-[0_8px_30px_-12px_rgba(120,60,20,0.5)]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, rgba(255,210,140,0.15), transparent 60%), radial-gradient(circle at 80% 80%, rgba(220,80,60,0.15), transparent 60%), linear-gradient(135deg, #2a1810 0%, #3d1f15 45%, #4a2418 100%)",
                }}
              >
                {/* 纸纹 */}
                <div
                  className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, rgba(255,220,180,0.4) 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, rgba(255,220,180,0.3) 0 1px, transparent 1px 4px)",
                  }}
                />
                {/* 中央水印（八卦/太极） */}
                <svg
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.06] pointer-events-none"
                  viewBox="0 0 100 100"
                  fill="none"
                  stroke="#f0c870"
                  strokeWidth="0.6"
                >
                  <circle cx="50" cy="50" r="46" />
                  <circle cx="50" cy="50" r="38" />
                  <path d="M50 12 A38 38 0 0 1 50 88 A19 19 0 0 1 50 50 A19 19 0 0 0 50 12 Z" fill="#f0c870" fillOpacity="0.5" />
                  <circle cx="50" cy="31" r="3" fill="#2a1810" />
                  <circle cx="50" cy="69" r="3" fill="#f0c870" />
                </svg>
                {/* 四角金线 */}
                <span className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-300/60" />
                <span className="absolute top-2 right-2 w-4 h-4 border-t border-r border-amber-300/60" />
                <span className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-amber-300/60" />
                <span className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-amber-300/60" />

                {/* 顶栏：副标 + 朱印 */}
                <div className="relative flex items-start justify-between mb-5">
                  <div className="text-[10px] tracking-[0.3em] text-amber-200/70">
                    第 {result.stickNumber} 签 · {result.level}
                  </div>
                  <div
                    className="flex flex-col items-center justify-center w-10 h-10 rounded-sm border-[1.5px] border-rose-300/90 text-rose-100 font-display text-[11px] leading-[1.05] tracking-[0.15em] shadow-[inset_0_0_4px_rgba(0,0,0,0.4)]"
                    style={{
                      background:
                        "linear-gradient(135deg, #b8332a 0%, #8a1f1a 100%)",
                    }}
                  >
                    <span>签</span>
                    <span>诗</span>
                  </div>
                </div>

                {/* 签诗正文 */}
                <div className="relative flex flex-col items-center gap-3 py-2">
                  {result.poem.split(/\n+/).map((line, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 * i + 0.1, duration: 0.5 }}
                      className="font-display text-lg md:text-xl text-center"
                      style={{
                        letterSpacing: "0.28em",
                        paddingLeft: "0.28em",
                        fontFamily:
                          '"Noto Serif SC", "Songti SC", "STSong", "STKaiti", serif',
                        background:
                          "linear-gradient(180deg, #fbe9a7 0%, #f0c870 55%, #d4a04a 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        textShadow: "0 1px 0 rgba(0,0,0,0.25)",
                      }}
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>

                {/* 落款 */}
                <div className="relative mt-5 flex items-center justify-center gap-2 text-[10px] tracking-[0.4em] text-amber-200/50">
                  <span className="h-px w-8 bg-amber-300/30" />
                  心灵密语 · 灵签
                  <span className="h-px w-8 bg-amber-300/30" />
                </div>
              </div>

              {/* 解签 */}
              <div className="rounded-2xl bg-card p-5 shadow-card mb-4">
                <h3 className="relative text-xs font-semibold text-secondary uppercase tracking-wider mb-3 pl-3 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-3.5 before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-amber-400 before:to-rose-500">
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
                    navigate(`/chat?agent=yunsheng`, {
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
                  className="flex-1 flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/90 py-3 text-sm font-medium text-primary-foreground shadow-[0_6px_20px_-8px_hsla(42,53%,54%,0.5)]"
                >
                  <Sparkles className="h-4 w-4" /> 找云生细聊
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