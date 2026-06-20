import { isDailyLimitError } from "@/lib/assessmentErrors";
import { persistAssessmentResult } from "@/lib/guestAssessment";
import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Download } from "lucide-react";
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
import { getNextVariant } from "@/lib/assessmentVariant";
import { pickZodiacQuestionSet } from "@/data/zodiacQuestionPool";
import ZodiacFortuneCards, { buildZodiacFortuneCards } from "@/components/ZodiacFortuneCards";
import ZodiacReadingCards from "@/components/ZodiacReadingCards";
import { normalizeZodiacReading, zodiacReadingToPlainText, type ZodiacReading } from "@/lib/zodiacReading";
import { buildZodiacPosterConfig } from "@/lib/assessmentPosterConfig";
import ZodiacSignPicker from "@/components/ZodiacSignPicker";
import {
  ZODIAC_SIGNS,
  localizeZodiacDate,
  localizeZodiacElement,
  localizeZodiacName,
} from "@/lib/zodiacLabels";

interface QA { question: string; answer: string; dimension: string; }

interface ZodiacResult {
  zodiacSign: string;
  element: string;
  title: string;
  description: string;
  reading?: ZodiacReading;
  traits: { overall: number; love: number; career: number; fortune: number };
  luckyItems: { color: string; number: string; direction: string };
  advice: string | {
    mantra: string;
    doThis: string[];
    avoidThis: string[];
    luckyMoment: string;
    crystalOrRitual: string;
  };
  socialCaption: string;
}

const ZODIAC_MOTIF: Record<string, string> = {
  Aries: "a bold ram with curling horns and a streak of fiery comet trails",
  Taurus: "a strong bull resting in a blooming flower field at golden hour",
  Gemini: "two mirrored figures holding hands among floating playing cards and feathers",
  Cancer: "a delicate crab beside ocean waves under a glowing crescent moon",
  Leo: "a regal lion with a mane shaped like a sunburst, surrounded by gold sparks",
  Virgo: "a graceful figure holding wheat sheaves with falling petals and tiny stars",
  Libra: "a balanced golden scale floating between two soft clouds and rose petals",
  Scorpio: "a mysterious scorpion silhouette with a glowing tail under deep night sky",
  Sagittarius: "a centaur archer drawing a bow toward a distant constellation",
  Capricorn: "a sea-goat climbing a rocky mountain peak under starry sky",
  Aquarius: "a figure pouring a stream of stars and water from a celestial vase",
  Pisces: "two koi-like fish swimming in a circle through cosmic bubbles",
  白羊座: "a bold ram with curling horns and a streak of fiery comet trails",
  金牛座: "a strong bull resting in a blooming flower field at golden hour",
  双子座: "two mirrored figures holding hands among floating playing cards and feathers",
  巨蟹座: "a delicate crab beside ocean waves under a glowing crescent moon",
  狮子座: "a regal lion with a mane shaped like a sunburst, surrounded by gold sparks",
  处女座: "a graceful figure holding wheat sheaves with falling petals and tiny stars",
  天秤座: "a balanced golden scale floating between two soft clouds and rose petals",
  天蝎座: "a mysterious scorpion silhouette with a glowing tail under deep night sky",
  射手座: "a centaur archer drawing a bow toward a distant constellation",
  摩羯座: "a sea-goat climbing a rocky mountain peak under starry sky",
  水瓶座: "a figure pouring a stream of stars and water from a celestial vase",
  双鱼座: "two koi-like fish swimming in a circle through cosmic bubbles",
};
const ELEMENT_PARTICLES: Record<string, string> = {
  Fire: "drifting embers and warm sparks", 火: "drifting embers and warm sparks",
  Earth: "floating crystals and small stones", 土: "floating crystals and small stones",
  Air: "soft wind swirls and feathers", 风: "soft wind swirls and feathers", 气: "soft wind swirls and feathers",
  Water: "rippling water droplets and bubbles", 水: "rippling water droplets and bubbles",
};
const getImagePromptForSign = (signName: string, element: string) => {
  const motif = ZODIAC_MOTIF[signName] || "an iconic celestial creature";
  const particles = ELEMENT_PARTICLES[element] || "twinkling starlight";
  return `Dreamy celestial illustration of the ${signName} zodiac, featuring ${motif} surrounded by ${particles}. Cosmic violet and indigo palette with starlight gold highlights, magical art-nouveau line accents, slightly playful and full of life. Square format, no text, no letters.`;
};
const getCacheKeyForSign = (signName: string) => `zodiac_${signName.toLowerCase()}`;

const ZodiacFlow = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user } = useAuth();
  const { sharePoster, fetchAIImage, posterDataUrl, showPosterPreview, closePosterPreview, downloadPoster } = useSharePoster();
  const { canAssess, assessmentLimit, incrementAssessment } = useSubscription(user?.id);
  const [history, setHistory] = useState<QA[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [result, setResult] = useState<ZodiacResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const resultIdRef = useRef<string | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const batchQuestionsRef = useRef<any[]>([]);
  const imagePromiseRef = useRef<Promise<string | null> | null>(null);

  const isZh = locale === "zh";
  const localizeName = (n: string) => localizeZodiacName(n, isZh);
  const localizeElement = (e: string) => localizeZodiacElement(e, isZh);

  const startImageFetch = useCallback((signName: string, element: string) => {
    setImageLoading(true);
    setResultImageUrl(null);
    const p = (async () => {
      try {
        const img = await fetchAIImage(getImagePromptForSign(signName, element), { cacheKey: getCacheKeyForSign(signName), returnUrlOnly: true });
        return img?.src || null;
      } catch { return null; }
    })();
    imagePromiseRef.current = p;
    return p;
  }, [fetchAIImage]);

  const awaitResultImage = useCallback(async () => {
    try {
      const url = imagePromiseRef.current ? await imagePromiseRef.current : null;
      if (url) {
        setResultImageUrl(url);
        if (resultIdRef.current) {
          const { data: existing } = await supabase.from("assessment_results").select("result_data").eq("id", resultIdRef.current).single();
          if (existing) { await supabase.from("assessment_results").update({ result_data: { ...existing.result_data as any, imageUrl: url } }).eq("id", resultIdRef.current); }
        }
      }
    } finally { setImageLoading(false); }
  }, []);

  const fetchResult = async (finalHistory: QA[], sign: string) => {
    setLoading(true);
    setLoadingMsg(t("assessmentFlow.common.analyzing"));
    try {
      const { data, error } = await supabase.functions.invoke("assessment-zodiac", {
        body: { history: finalHistory, zodiacSign: sign, locale },
      });
      if (error) throw error;
      if (data.type === "result") {
        setResult(data.data);
        setCurrentQuestion(null);
        awaitResultImage();
        const newId = await persistAssessmentResult(user?.id ?? null, "zodiac", data.data);
        if (newId) { resultIdRef.current = newId; setSavedReportId(newId); }
        if (user) generateSoulFragment(user.id, "assessment", "zodiac", `Horoscope: ${data.data.zodiacSign} ${data.data.title}. ${zodiacReadingToPlainText(normalizeZodiacReading(data.data)) || data.data.description}`);
      }
    } catch (e: any) {
      if (isDailyLimitError(e)) toast.error(t("assessmentFlow.common.limitReached", { n: 20 }));
      else toast.error(e.message || t("assessmentFlow.common.loadFail"));
    } finally { setLoading(false); }
  };

  const handleSelectSign = async (signName: string) => {
    // Allow anonymous users to take the quiz; saving is gated later.
    if (!canAssess) { toast.error(t("assessmentFlow.common.limitReached", { n: assessmentLimit })); return; }
    await incrementAssessment();
    setSelectedSign(signName);
    const signMeta = ZODIAC_SIGNS.find(z => z.name === signName);
    if (signMeta) startImageFetch(signName, signMeta.element);
    setLoading(true);
    setLoadingMsg(t("assessmentFlow.common.starting"));

    // Kick off AI batch fetch, but don't block UI on it. If it lands within
    // ~500ms we use it; otherwise we fall back to the local pool so Q1 shows
    // immediately. Daily-limit errors still surface as a toast.
    const variant = getNextVariant(`zodiac:${signName}`, locale);
    const fetchPromise = supabase.functions
      .invoke("assessment-zodiac", { body: { action: "batch-questions", zodiacSign: signName, locale, variant } })
      .then((res) => {
        if (res.error) throw res.error;
        const d = res.data;
        return d?.type === "batch" && Array.isArray(d.data) && d.data.length >= 10 ? d.data : null;
      })
      .catch((e: any) => {
        if (isDailyLimitError(e)) toast.error(t("assessmentFlow.common.limitReached", { n: 20 }));
        return null;
      });

    const batch = await Promise.race([
      fetchPromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 500)),
    ]);

    const finalBatch = batch && batch.length >= 10 ? batch : pickZodiacQuestionSet(locale);
    batchQuestionsRef.current = finalBatch.slice(1);
    setCurrentQuestion(finalBatch[0]);
    setLoading(false);
  };

  const handleAnswer = (option: { label: string; text: string }) => {
    if (!currentQuestion) return;
    const qa: QA = { question: currentQuestion.question, answer: `${option.label}. ${option.text}`, dimension: currentQuestion.dimension };
    const newHistory = [...history, qa];
    setHistory(newHistory);
    if (batchQuestionsRef.current.length > 0) {
      const next = batchQuestionsRef.current[0];
      batchQuestionsRef.current = batchQuestionsRef.current.slice(1);
      setCurrentQuestion(next);
    } else { setCurrentQuestion(null); fetchResult(newHistory, selectedSign!); }
  };

  const handleSharePoster = () => {
    if (!result) return;
    sharePoster(
      buildZodiacPosterConfig(result, t, isZh, {
        preloadedImageUrl: resultImageUrl || undefined,
        imagePrompt: !resultImageUrl ? getImagePromptForSign(result.zodiacSign, result.element) : undefined,
        imageCacheKey: getCacheKeyForSign(result.zodiacSign),
      }),
    );
  };

  if (!selectedSign) {
    return (
      <ZodiacSignPicker
        isZh={isZh}
        onBack={() => navigate("/assessment")}
        onSelect={handleSelectSign}
      />
    );
  }

  if (result) {
    const signIcon = ZODIAC_SIGNS.find(z => z.name === result.zodiacSign)?.icon || "⭐";
    const reading = normalizeZodiacReading(result);
    return (
      <div className="min-h-screen bg-gradient-calm pb-8">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/assessment")} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h2 className="text-sm font-semibold text-foreground">{t("assessmentFlow.zodiac.resultsTitle")}</h2>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6">
          <div className="text-center mt-4 mb-6">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-mystic flex items-center justify-center"><span className="text-3xl">{signIcon}</span></div>
            <h1 className="font-display text-xl font-bold text-foreground">{localizeName(result.zodiacSign)} · {result.title}</h1>
            <p className="mt-1 text-xs text-gold-light/90">{localizeElement(result.element)}{t("assessmentFlow.zodiac.elementSuffix")}</p>
            <p className="mt-1 text-xs text-muted-foreground">"{result.socialCaption}"</p>
          </div>
          <ResultAIImage imageUrl={resultImageUrl} loading={imageLoading} />
          <div className="rounded-2xl bg-card p-5 shadow-card mb-4">
            <h3 className="font-display text-sm font-semibold text-foreground mb-1">{t("assessmentFlow.zodiac.reading")}</h3>
            <p className="text-[10px] text-muted-foreground mb-4">{t("assessmentFlow.zodiac.readingHint")}</p>
            <ZodiacReadingCards
              reading={reading}
              labelFn={(key) => t(`assessmentDetail.dim.${key}`)}
              hookLabel={t("assessmentFlow.zodiac.readingHook")}
            />
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-card mb-4">
            <h3 className="font-display text-sm font-semibold text-foreground mb-1">{t("assessmentDetail.dimensions")}</h3>
            <p className="text-[10px] text-muted-foreground mb-4">{t("assessmentFlow.zodiac.cardsHint")}</p>
            <ZodiacFortuneCards
              dimensions={buildZodiacFortuneCards(result.traits, (k) => t(`assessmentDetail.dim.${k}`))}
            />
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-card mb-4">
            <h3 className="font-display text-sm font-semibold text-foreground mb-3">{t("assessmentFlow.zodiac.luckyGuide")}</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-xs text-muted-foreground">{t("assessmentFlow.zodiac.luckyColor")}</p><p className="text-sm font-semibold text-foreground mt-1">{result.luckyItems.color}</p></div>
              <div><p className="text-xs text-muted-foreground">{t("assessmentFlow.zodiac.luckyNumber")}</p><p className="text-sm font-semibold text-foreground mt-1">{result.luckyItems.number}</p></div>
              <div><p className="text-xs text-muted-foreground">{t("assessmentFlow.zodiac.luckyDirection")}</p><p className="text-sm font-semibold text-foreground mt-1">{result.luckyItems.direction}</p></div>
            </div>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-card mb-4">
            <h3 className="font-display text-sm font-semibold text-foreground mb-3">{t("assessmentFlow.zodiac.thisWeek")}</h3>
            {typeof result.advice === "string" ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{result.advice}</p>
            ) : (
              <div className="space-y-4">
                {/* Mantra */}
                <div className="relative rounded-xl bg-gradient-mystic/10 border border-primary/15 px-4 py-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{t("assessmentFlow.zodiac.mantraTitle")}</p>
                  <p className="font-display text-base text-gradient-golden leading-snug font-semibold">
                    "{result.advice.mantra}"
                  </p>
                </div>

                {/* Do This */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">{t("assessmentFlow.zodiac.doThis")}</p>
                  <ul className="space-y-2">
                    {result.advice.doThis.map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i }}
                        className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground/90 leading-relaxed"
                      >
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Avoid This */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">{t("assessmentFlow.zodiac.avoidThis")}</p>
                  <ul className="space-y-2">
                    {result.advice.avoidThis.map((item, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2 text-sm text-foreground/80 leading-relaxed"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Lucky moment + Ritual */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl bg-secondary/10 border border-secondary/20 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">⏰ {t("assessmentFlow.zodiac.luckyMoment")}</p>
                    <p className="text-xs text-foreground/90 leading-relaxed">{result.advice.luckyMoment}</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 border border-primary/15 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-primary mb-1">🔮 {t("assessmentFlow.zodiac.ritualTitle")}</p>
                    <p className="text-xs text-foreground/90 leading-relaxed">{result.advice.crystalOrRitual}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {savedReportId && (
            <div className="mb-4">
              <DeepReportUnlock source="assessment" reportId={savedReportId} typeLabel={`${result.zodiacSign} · ${result.title}`} />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={handleSharePoster} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-card py-3 text-sm font-medium text-foreground shadow-card">
              <Download className="h-4 w-4" /> {t("assessmentFlow.common.saveAndShare")}
            </button>
            <button onClick={() => navigate(`/chat?agent=xinggui`, {
              state: { zodiacResult: { zodiacSign: result.zodiacSign, element: result.element, title: result.title, description: zodiacReadingToPlainText(reading) || result.description, reading, traits: result.traits, luckyItems: result.luckyItems, advice: result.advice } },
            })} className="flex-1 rounded-xl bg-gradient-golden py-3 text-sm font-semibold text-primary-foreground">
              {t("assessmentFlow.zodiac.talkToXinggui")}
            </button>
          </div>
        </motion.div>
        <PosterPreviewDialog open={showPosterPreview} dataUrl={posterDataUrl} onClose={closePosterPreview} onDownload={downloadPoster} />
      </div>
    );
  }

  return (
    <AssessmentQuestionLayout title={t("assessmentFlow.zodiac.title")} backPath="/assessment" questionNumber={history.length + 1} totalQuestions={10} loading={loading} loadingMessage={loadingMsg} question={currentQuestion} onAnswer={handleAnswer} />
  );
};

export default ZodiacFlow;
