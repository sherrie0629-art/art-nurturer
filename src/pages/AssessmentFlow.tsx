import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Sparkles } from "lucide-react";
import DesktopLayout from "@/components/DesktopLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { generateSoulFragment } from "@/hooks/useSoulFragment";
import { useSubscription } from "@/hooks/useSubscription";
import { useSharePoster } from "@/hooks/useSharePoster";
import { useLocale } from "@/hooks/useLocale";
import AssessmentQuestionLayout from "@/components/AssessmentQuestionLayout";
import ResultAIImage from "@/components/ResultAIImage";
import PosterPreviewDialog from "@/components/PosterPreviewDialog";
import DeepReportUnlock from "@/components/DeepReportUnlock";
import { isDailyLimitError } from "@/lib/assessmentErrors";
import { Skeleton } from "@/components/ui/skeleton";
import { pickQuestionSet } from "@/data/mbtiQuestionPool";
import { getNextVariant } from "@/lib/assessmentVariant";
import { persistAssessmentResult } from "@/lib/guestAssessment";
import { getFallbackParallelUniverse } from "@/lib/fallbackParallelUniverse";

interface QA { question: string; answer: string; dimension: string; }
interface MBTIResult { mbtiType: string; title: string; description: string; traits: { E_I: number; S_N: number; T_F: number; J_P: number }; socialCaption: string; }

const MBTI_MOTIF: Record<string, string> = {
  INTJ: "a chess king on a starry strategic board with subtle architectural blueprint lines",
  INTP: "floating equations, a half-open book and a curious magnifying glass orbiting a small planet",
  ENTJ: "a tall castle silhouette with rising arrows and a bold compass pointing forward",
  ENTP: "a brain-shaped lightbulb sparking ideas, surrounded by paper airplanes",
  INFJ: "a single candle flame in a quiet temple, a gentle moon and rippling water",
  INFP: "floating poetry pages and pressed flowers around a crescent moon",
  ENFJ: "a warm hand guiding glowing little stars upward like a teacher and students",
  ENFP: "a vibrant burst of confetti, balloons and a sketchbook full of wild ideas",
  ISTJ: "an open pocket watch with precise gears and a stack of neatly tied scrolls",
  ISFJ: "a cozy knitted blanket, a teapot and a warmly lit window at dusk",
  ESTJ: "a strong oak tree with a banner, organized files and a clear horizon",
  ESFJ: "a long dinner table with candles, flowers and gifts being shared",
  ISTP: "a half-disassembled motorcycle engine with floating tools and a small spark",
  ISFP: "a painter's palette, drifting petals and a soft watercolor wash",
  ESTP: "a skateboard mid-air with motion lines, neon sparks and city lights",
  ESFP: "a microphone, party streamers and a disco ball raining colorful light",
};
const getImagePrompt = (result: MBTIResult) => {
  const motif = MBTI_MOTIF[result.mbtiType] || "abstract symbolic shapes";
  return `Modern editorial illustration for MBTI ${result.mbtiType} "${result.title}", featuring ${motif}. Deep indigo and violet palette with one warm accent color (gold or coral), mix of geometric and organic shapes, intellectual yet poetic mood, hand-drawn linework with subtle paper texture. Square format, no text, no letters.`;
};

const isUnauthorizedFunctionError = (e: any) => {
  const status = e?.context?.status;
  const msg = String(e?.message || e || "").toLowerCase();
  return status === 401 || msg.includes("401") || msg.includes("unauthorized");
};

const hasUsableUserToken = (token?: string | null) => {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload?.sub) return false;
    if (payload.exp && payload.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
};

const MBTI_FLAVOR: Record<string, { zh: { title: string; line: string }; en: { title: string; line: string } }> = {
  INTJ: { zh: { title: "深夜推演的策略脑", line: "你做决定前像在脑子里下三盘棋，别人还在纠结A还是B，你已经在算C会不会反噬。情绪先放一边，结论先递上来。" }, en: { title: "Late-Night Strategist", line: "You play three chess games in your head before choosing. While others debate A vs B, you're checking if C backfires. Feelings later, conclusion first." } },
  INTP: { zh: { title: "拆解一切的好奇脑", line: "你不爱跟着大家点头，更想知道「为什么这玩意儿能跑」。一旦琢磨上一个问题，外卖凉了你都没发觉。" }, en: { title: "Curious Disassembler", line: "You'd rather know why it works than nod along. Once a question grabs you, even the takeout going cold can't pull you out." } },
  ENTJ: { zh: { title: "天生带节奏的指挥官", line: "走进一个乱糟糟的局，三分钟你就能排好优先级。别人觉得你强势，其实你只是受不了「明明能更好」还在原地耗。" }, en: { title: "Natural-Born Conductor", line: "Walk into chaos, leave with a ranked todo list in three minutes. People call it pushy; you just can't watch potential get wasted." } },
  ENTP: { zh: { title: "脑洞永动机", line: "你嘴里随口一句「如果反过来呢」，别人能琢磨一周。规则对你来说不是墙，是健身器材。" }, en: { title: "Idea Perpetual Machine", line: "Your offhand 'what if we flipped it' keeps others up for a week. Rules aren't walls to you — they're gym equipment." } },
  INFJ: { zh: { title: "看一眼就懂的洞察者", line: "你能从一句客套里听出对方真正想说的那半句。心里替很多人想过了，嘴上却只留温柔的那部分。" }, en: { title: "One-Glance Insight", line: "You hear the half-sentence people don't say. You've already thought it through for everyone — and only let the gentle part out loud." } },
  INFP: { zh: { title: "把世界写成诗的灵魂", line: "你做选择不靠利弊表，靠「这件事像不像我」。看起来安静，心里其实正在为一只流浪猫安排三种未来。" }, en: { title: "Soul That Writes the World as Poetry", line: "You don't pick with pros-and-cons; you pick what feels like you. Quiet outside, plotting three futures for a stray cat inside." } },
  ENFJ: { zh: { title: "自带聚光灯的暖人", line: "你走进房间，话题就自动柔软。别人没说出口的需要，你先递了过去——结果常常自己累，还安慰别人没事。" }, en: { title: "Warmth With a Spotlight", line: "You walk in and the room softens. You hand people the thing they didn't ask for — then comfort them about your own tired." } },
  ENFP: { zh: { title: "灵感乱蹦的彩虹", line: "你一天可以同时爱上三个项目，再用第四个把它们串起来。被人说三分钟热度时，你已经在第六件事里发光了。" }, en: { title: "Rainbow on Caffeine", line: "You fall for three projects a day and lash them together with a fourth. While they call you flaky, you're already glowing inside project six." } },
  ISTJ: { zh: { title: "靠谱到发亮的定海针", line: "答应的事按时交，不答应的事不模糊。别人慌的时候第一反应是找你，因为你那儿什么都有备份。" }, en: { title: "The Anchor That Quietly Shines", line: "You ship on time and never half-promise. When others panic, they look for you — your backups have backups." } },
  ISFJ: { zh: { title: "把人都记心里的守护者", line: "你记得每个朋友的过敏源、生日和上次没说完的那句话。你的好藏在细节里，像有人偷偷把你冬天的鞋烘暖了。" }, en: { title: "Quiet Guardian Who Remembers Everything", line: "You remember everyone's allergy, birthday, and the sentence they didn't finish. Your care hides in details — like warm shoes on a cold morning." } },
  ESTJ: { zh: { title: "雷厉风行的执行派", line: "你不爱开会爱拍板。流程在你手里像被拧紧的螺丝，谁拖延都会被你温柔地——按时——盯回正轨。" }, en: { title: "Get-It-Done Executor", line: "You hate meetings, love decisions. Processes tighten under you like screws; procrastinators get politely — and punctually — corrected." } },
  ESFJ: { zh: { title: "把饭桌坐满的连结者", line: "你记得谁不吃香菜、谁刚分手、谁该被夸一句。你的厉害不在镁光灯下，而在每个人离场时心里那点暖。" }, en: { title: "The One Who Fills the Table", line: "You know who skips cilantro, who just got dumped, who needs a compliment. Your magic isn't on stage — it's in the warmth people leave with." } },
  ISTP: { zh: { title: "话不多但手很稳", line: "出问题的瞬间，别人在吵，你已经蹲下来在拆。你不擅长解释心情，但你修过的东西从不假装。" }, en: { title: "Quiet Hands That Just Fix It", line: "When something breaks, others argue; you've already crouched down to take it apart. You can't always explain feelings — but the things you fix never fake it." } },
  ISFP: { zh: { title: "活成审美本身的人", line: "你挑伞、挑歌单、挑外卖盒都讲究那一点点「对」。话不多，但你住过的角落，朋友都会忍不住多坐一会儿。" }, en: { title: "Aesthetic in Human Form", line: "You pick umbrellas, playlists and takeout boxes by some private rightness. You don't say much, but friends linger in any corner you've touched." } },
  ESTP: { zh: { title: "动了才会想清楚的行动派", line: "你不爱开十次会改三版PPT，先冲一波再说。失败也认，反正下一秒已经换路线了。" }, en: { title: "Think-By-Doing Mover", line: "You hate ten meetings and three slide revisions. Charge first, learn fast. Failure? Sure — already pivoting before you finish admitting it." } },
  ESFP: { zh: { title: "把日子过成花絮的快乐源", line: "你不挑天气，雨天也能凑成一场临时街头演唱会。朋友圈最舍不得屏蔽你，因为没有你那场聚会就缺了一半声音。" }, en: { title: "The Source Spot of Joy", line: "Rain doesn't bother you — it just becomes an impromptu street gig. Nobody mutes you online; the group chat is half-silent when you're not in it." } },
};

const dominantSide = (val: number, leftHigh: string, leftLow: string, rightHigh: string) => {
  if (val >= 65) return `${leftHigh} ${val}%`;
  if (val <= 35) return `${rightHigh} ${100 - val}%`;
  return `${leftLow} ${val}%`;
};

const getFallbackMbtiResult = (history: QA[], locale: string): MBTIResult => {
  const score = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  const optionWeight: Record<string, [number, number]> = { A: [1.8, 0.2], B: [0.6, 1.4], C: [1.4, 0.6], D: [0.2, 1.8] };

  history.forEach((item) => {
    const [left, right] = item.dimension.split("/") as [keyof typeof score, keyof typeof score];
    const letter = item.answer.trim().charAt(0).toUpperCase();
    const [leftWeight, rightWeight] = optionWeight[letter] || [1, 1];
    if (left && right && left in score && right in score) {
      score[left] += leftWeight;
      score[right] += rightWeight;
    }
  });

  const pct = (left: keyof typeof score, right: keyof typeof score) => {
    const total = score[left] + score[right] || 1;
    return Math.round((score[left] / total) * 100);
  };

  const traits = { E_I: pct("E", "I"), S_N: pct("S", "N"), T_F: pct("T", "F"), J_P: pct("J", "P") };
  const mbtiType = `${traits.E_I >= 50 ? "E" : "I"}${traits.S_N >= 50 ? "S" : "N"}${traits.T_F >= 50 ? "T" : "F"}${traits.J_P >= 50 ? "J" : "P"}`;
  const isZh = locale === "zh";
  const flavor = MBTI_FLAVOR[mbtiType] || MBTI_FLAVOR.INFP;
  const f = isZh ? flavor.zh : flavor.en;

  // Build a small "where you lean" line from the strongest two axes.
  const axes = isZh
    ? [
        { v: traits.E_I, hi: "外向 E", lo: "外向 E", hiR: "内向 I" },
        { v: traits.S_N, hi: "实感 S", lo: "实感 S", hiR: "直觉 N" },
        { v: traits.T_F, hi: "思考 T", lo: "思考 T", hiR: "情感 F" },
        { v: traits.J_P, hi: "判断 J", lo: "判断 J", hiR: "知觉 P" },
      ]
    : [
        { v: traits.E_I, hi: "Extraverted", lo: "Extraverted", hiR: "Introverted" },
        { v: traits.S_N, hi: "Sensing", lo: "Sensing", hiR: "Intuitive" },
        { v: traits.T_F, hi: "Thinking", lo: "Thinking", hiR: "Feeling" },
        { v: traits.J_P, hi: "Judging", lo: "Judging", hiR: "Perceiving" },
      ];
  const ranked = axes
    .map((a) => ({ ...a, dist: Math.abs(a.v - 50) }))
    .sort((a, b) => b.dist - a.dist)
    .slice(0, 2)
    .map((a) => dominantSide(a.v, a.hi, a.lo, a.hiR));
  const leanLine = isZh
    ? `从这 ${history.length} 题里看，你身上 ${ranked.join("、")} 的味道最浓。`
    : `Across your ${history.length} answers, the strongest currents are ${ranked.join(" and ")}.`;
  const cta = isZh
    ? `（登录后还能解锁一份更长的 AI 深度解读，并把结果留进你的档案。）`
    : `(Sign in for a longer AI deep-read and to save this to your archive.)`;

  return {
    mbtiType,
    title: f.title,
    description: `${f.line} ${leanLine} ${cta}`,
    traits,
    socialCaption: isZh ? `我是 ${mbtiType}，刚被这份测评说中了。` : `I'm ${mbtiType} — and this quiz called me out.`,
  };
};

const AssessmentFlow = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user, session, promptLogin, signOut } = useAuth();
  const { sharePoster, fetchAIImage, posterDataUrl, showPosterPreview, closePosterPreview, downloadPoster } = useSharePoster();
  const { canAssess, assessmentLimit, incrementAssessment } = useSubscription(user?.id);
  const [history, setHistory] = useState<QA[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [result, setResult] = useState<MBTIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [started, setStarted] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [parallelData, setParallelData] = useState<{ magic: { role: string; description: string }; cyberpunk: { role: string; description: string } } | null>(null);
  const [parallelLoading, setParallelLoading] = useState(false);
  const resultIdRef = useRef<string | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const batchQuestionsRef = useRef<any[]>([]);

  const fetchResultImage = useCallback(async (r: MBTIResult) => {
    setImageLoading(true);
    // Safety timeout: never block the result UI on the image
    const timeoutId = setTimeout(() => setImageLoading(false), 30000);
    try {
      const img = await fetchAIImage(getImagePrompt(r), { cacheKey: `mbti-${r.mbtiType}`, returnUrlOnly: true });
      if (img) { setResultImageUrl(img.src); if (resultIdRef.current) { const { data: existing } = await supabase.from("assessment_results").select("result_data").eq("id", resultIdRef.current).single(); if (existing) { await supabase.from("assessment_results").update({ result_data: { ...existing.result_data as any, imageUrl: img.src } }).eq("id", resultIdRef.current); } } }
    } finally { clearTimeout(timeoutId); setImageLoading(false); }
  }, [fetchAIImage]);

  const fetchParallelUniverse = useCallback(async (mbtiType: string) => {
    if (!user || !hasUsableUserToken(session?.access_token)) {
      setParallelData(getFallbackParallelUniverse(mbtiType, locale));
      return;
    }
    setParallelLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("assessment", { body: { action: "parallel-universe", mbtiType, locale } });
      if (!error && data) { setParallelData(data); if (resultIdRef.current) { const { data: existing } = await supabase.from("assessment_results").select("result_data").eq("id", resultIdRef.current).single(); if (existing) { await supabase.from("assessment_results").update({ result_data: { ...existing.result_data as any, parallelUniverse: data } }).eq("id", resultIdRef.current); } } }
      else setParallelData(getFallbackParallelUniverse(mbtiType, locale));
    } catch {
      setParallelData(getFallbackParallelUniverse(mbtiType, locale));
    } finally { setParallelLoading(false); }
  }, [locale, session?.access_token, user]);

  const fetchResult = async (finalHistory: QA[]) => {
    setLoading(true); setLoadingMsg(t("assessmentFlow.common.analyzing"));
    try {
      if (!user || !hasUsableUserToken(session?.access_token)) {
        if (user) await signOut();
        const fallback = getFallbackMbtiResult(finalHistory, locale);
        setResult(fallback);
        setCurrentQuestion(null);
        setParallelData(getFallbackParallelUniverse(fallback.mbtiType, locale));
        // Persist the fallback so the result still shows up in the user's
        // report list (stashed locally if they're not signed in, then
        // migrated after sign-in).
        const newId = await persistAssessmentResult(user?.id ?? null, "mbti", fallback);
        if (newId) { resultIdRef.current = newId; setSavedReportId(newId); }
        promptLogin(t("auth.promptAssessmentAI"));
        return;
      }
      const { data, error } = await supabase.functions.invoke("assessment", { body: { history: finalHistory, locale } });
      if (error) throw error;
      if (data.type === "result") {
        setResult(data.data); setCurrentQuestion(null); fetchResultImage(data.data); fetchParallelUniverse(data.data.mbtiType);
        const newId = await persistAssessmentResult(user?.id ?? null, "mbti", data.data);
        if (newId) { resultIdRef.current = newId; setSavedReportId(newId); }
        if (user) generateSoulFragment(user.id, "assessment", "mbti", `MBTI result: ${data.data.mbtiType} ${data.data.title}. ${data.data.description}`);
      }
    } catch (e: any) {
      if (isDailyLimitError(e)) toast.error(t("assessmentFlow.common.limitReached", { n: 20 }));
      else if (isUnauthorizedFunctionError(e)) {
        await signOut();
        const fallback = getFallbackMbtiResult(finalHistory, locale);
        setResult(fallback);
        setCurrentQuestion(null);
        setParallelData(getFallbackParallelUniverse(fallback.mbtiType, locale));
        // Stash so it's not lost; sign-in will migrate.
        await persistAssessmentResult(null, "mbti", fallback);
        toast.error(t("auth.signInFirst"));
        promptLogin(t("auth.promptAssessmentAI"));
      } else toast.error(e.message || t("assessmentFlow.common.loadFail"));
    } finally { setLoading(false); }
  };

  // Prefetch a fresh AI-generated batch in the background while user reads the intro.
  // Pick a variant up front so prefetch + fallback share the same one (advances once per session).
  const variantRef = useRef<number | null>(null);
  const prefetchedRef = useRef<Promise<any[] | null> | null>(null);
  useEffect(() => {
    if (started || prefetchedRef.current) return;
    if (!user || !hasUsableUserToken(session?.access_token)) return;
    if (variantRef.current === null) variantRef.current = getNextVariant("mbti", locale);
    prefetchedRef.current = supabase.functions
      .invoke("assessment", { body: { action: "batch-questions", locale, variant: variantRef.current } })
      .then(({ data, error }) => (!error && data?.type === "batch" && Array.isArray(data.data) && data.data.length >= 10 ? data.data : null))
      .catch(() => null);
  }, [started, locale, session?.access_token, user]);

  const handleStart = async () => {
    // Allow anonymous users to take the quiz; saving + deep report are gated later.
    if (!canAssess) { toast.error(t("assessmentFlow.common.limitReached", { n: assessmentLimit })); return; }
    await incrementAssessment();
    setStarted(true);

    // 1) Try to use already-prefetched AI batch (often ready by the time user clicks Start).
    let batch: any[] | null = null;
    if (prefetchedRef.current) {
      batch = await Promise.race([
        prefetchedRef.current,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 400)),
      ]);
    }

    // 2) Fallback to the local curated pool — instant, no network.
    if (!batch || batch.length < 10) {
      batch = pickQuestionSet(locale);
      // Keep the prefetch running so a later session can use it; also kick a new one for next time.
      if (user && hasUsableUserToken(session?.access_token) && !prefetchedRef.current) {
        const v = variantRef.current ?? getNextVariant("mbti", locale);
        supabase.functions.invoke("assessment", { body: { action: "batch-questions", locale, variant: v } }).catch(() => {});
      }
    }

    batchQuestionsRef.current = batch.slice(1);
    setCurrentQuestion(batch[0]);
    setLoading(false);
  };

  const handleAnswer = (option: { label: string; text: string }) => {
    if (!currentQuestion) return;
    const qa: QA = { question: currentQuestion.question, answer: `${option.label}. ${option.text}`, dimension: currentQuestion.dimension };
    const newHistory = [...history, qa]; setHistory(newHistory);
    if (batchQuestionsRef.current.length > 0) { const next = batchQuestionsRef.current[0]; batchQuestionsRef.current = batchQuestionsRef.current.slice(1); setCurrentQuestion(next); }
    else { setCurrentQuestion(null); fetchResult(newHistory); }
  };

  const dimEI = t("assessmentFlow.mbti.dim.ei", { returnObjects: true }) as string[];
  const dimSN = t("assessmentFlow.mbti.dim.sn", { returnObjects: true }) as string[];
  const dimTF = t("assessmentFlow.mbti.dim.tf", { returnObjects: true }) as string[];
  const dimJP = t("assessmentFlow.mbti.dim.jp", { returnObjects: true }) as string[];

  const handleSharePoster = () => {
    if (!result) return;
    sharePoster({
      title: result.mbtiType, subtitle: result.title, description: result.description, icon: "🧠", caption: result.socialCaption,
      accentColor: "#6366f1", accentColorLight: "#818cf8",
      bars: [
        { label1: dimEI[0], label2: dimEI[1], value: result.traits.E_I },
        { label1: dimSN[0], label2: dimSN[1], value: result.traits.S_N },
        { label1: dimTF[0], label2: dimTF[1], value: result.traits.T_F },
        { label1: dimJP[0], label2: dimJP[1], value: result.traits.J_P },
      ],
      extraLines: parallelData ? [`${t("assessmentFlow.mbti.fantasyWorld")}: ${parallelData.magic.role}`, `${t("assessmentFlow.mbti.cyberpunk")}: ${parallelData.cyberpunk.role}`] : undefined,
      preloadedImageUrl: resultImageUrl || undefined, imagePrompt: !resultImageUrl ? getImagePrompt(result) : undefined,
    });
  };

  if (!started) {
    return (
      <DesktopLayout>
      <div className="min-h-screen bg-gradient-calm flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/assessment")} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h2 className="text-sm font-semibold text-foreground">{t("assessmentFlow.mbti.title")}</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-mystic flex items-center justify-center"><span className="text-4xl">🧠</span></div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t("assessmentFlow.mbti.introTitle")}</h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{t("assessmentFlow.mbti.introDesc")}</p>
            <button onClick={handleStart} className="mt-8 rounded-xl bg-gradient-golden px-8 py-3 text-sm font-semibold text-primary-foreground shadow-glow">{t("assessmentFlow.mbti.start")}</button>
          </motion.div>
        </div>
      </div>
      </DesktopLayout>
    );
  }

  if (result) {
    return (
      <DesktopLayout>
      <div className="min-h-screen bg-gradient-calm pb-8">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/assessment")} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h2 className="text-sm font-semibold text-foreground">{t("assessmentFlow.mbti.resultsTitle")}</h2>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6">
          <div className="text-center mt-4 mb-6">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-mystic flex items-center justify-center"><span className="font-display text-2xl font-bold text-primary-foreground">{result.mbtiType}</span></div>
            <h1 className="font-display text-xl font-bold text-foreground">{result.mbtiType} — {result.title}</h1>
            <p className="mt-1 text-xs text-secondary">"{result.socialCaption}"</p>
          </div>
          <ResultAIImage imageUrl={resultImageUrl} loading={imageLoading} />
          <div className="rounded-2xl bg-card p-5 shadow-card mb-4"><h3 className="font-display text-sm font-semibold text-foreground mb-3">{t("assessmentFlow.mbti.personalityAnalysis")}</h3><p className="text-sm text-muted-foreground leading-relaxed">{result.description}</p></div>
          <div className="rounded-2xl bg-card p-5 shadow-card mb-4">
            <h3 className="font-display text-sm font-semibold text-foreground mb-4">{t("assessmentFlow.mbti.dimensionAnalysis")}</h3>
            {[
              { l1: dimEI[0], l2: dimEI[1], v: result.traits.E_I },
              { l1: dimSN[0], l2: dimSN[1], v: result.traits.S_N },
              { l1: dimTF[0], l2: dimTF[1], v: result.traits.T_F },
              { l1: dimJP[0], l2: dimJP[1], v: result.traits.J_P },
            ].map(b => (
              <div key={b.l1} className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>{b.l1}</span><span>{b.l2}</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${b.v}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-golden" /></div>
                <div className="text-right text-[10px] text-muted-foreground mt-0.5">{b.v}%</div>
              </div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl bg-card p-5 shadow-card mb-4">
            <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-accent" /> {t("assessmentFlow.mbti.parallelUniverse")}</h3>
            {parallelLoading ? (<div className="space-y-3"><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-16 rounded-xl" /></div>) : parallelData ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs font-semibold text-foreground mb-1">{t("assessmentFlow.mbti.fantasyWorld")} · {parallelData.magic.role}</p><p className="text-xs text-muted-foreground leading-relaxed">{parallelData.magic.description}</p></div>
                <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs font-semibold text-foreground mb-1">{t("assessmentFlow.mbti.cyberpunk")} · {parallelData.cyberpunk.role}</p><p className="text-xs text-muted-foreground leading-relaxed">{parallelData.cyberpunk.description}</p></div>
              </div>
            ) : null}
          </motion.div>
          {(savedReportId || !user) && (
            <div className="mb-4">
              <DeepReportUnlock source="assessment" reportId={savedReportId || ""} typeLabel={`${result.mbtiType} — ${result.title}`} />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={handleSharePoster} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-card py-3 text-sm font-medium text-foreground shadow-card"><Download className="h-4 w-4" /> {t("assessmentFlow.common.saveAndShare")}</button>
            <button onClick={() => navigate(`/chat?agent=nuannuan`, { state: { mbtiResult: { mbtiType: result.mbtiType, title: result.title, description: result.description, parallelUniverse: parallelData || undefined } } })}
              className="flex-1 rounded-xl bg-gradient-golden py-3 text-sm font-semibold text-primary-foreground">{t("assessmentFlow.common.talkAboutIt")}</button>
          </div>
        </motion.div>
        <PosterPreviewDialog open={showPosterPreview} dataUrl={posterDataUrl} onClose={closePosterPreview} onDownload={downloadPoster} />
      </div>
      </DesktopLayout>
    );
  }

  return <AssessmentQuestionLayout title={t("assessmentFlow.mbti.title")} backPath="/assessment" questionNumber={history.length + 1} totalQuestions={10} loading={loading} loadingMessage={loadingMsg} question={currentQuestion} onAnswer={handleAnswer} />;
};

export default AssessmentFlow;
