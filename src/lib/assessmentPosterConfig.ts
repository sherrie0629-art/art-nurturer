import type { TFunction } from "i18next";
import type { PosterConfig } from "@/hooks/useSharePoster";
import { normalizeAssessmentProfile } from "@/lib/assessmentProfile";
import { buildAssessmentPosterBars } from "@/lib/posterBars";
import { probeMbtiPosterCached } from "@/lib/mbtiPosterCache";
import {
  normalizeZodiacReading,
  zodiacReadingToPlainText,
  zodiacReadingToPosterProfile,
} from "@/lib/zodiacReading";
import { getZodiacIcon, localizeZodiacElement, localizeZodiacName } from "@/lib/zodiacLabels";

type ProfileSource = {
  description?: string;
  profileHook?: string;
  profileBullets?: string[];
};

function profileFields(source: ProfileSource) {
  const profile = normalizeAssessmentProfile(source);
  return {
    description: source.description || "",
    profileHook: profile.hook,
    profileBullets: profile.bullets,
  };
}

export function buildMbtiPosterConfig(
  result: {
    mbtiType: string;
    title: string;
    description: string;
    profileHook?: string;
    profileBullets?: string[];
    traits: Record<string, number>;
    socialCaption: string;
  },
  t: TFunction,
  options?: {
    parallelExtraLines?: string[];
    preloadedImageUrl?: string;
    imagePrompt?: string;
    imageCacheKey?: string;
  },
): PosterConfig {
  const profile = profileFields(result);
  return {
    title: `${result.mbtiType} — ${result.title}`,
    subtitle: result.mbtiType,
    ...profile,
    icon: "🧠",
    caption: result.socialCaption,
    accentColor: "#6366f1",
    accentColorLight: "#818cf8",
    barsSectionTitle: t("assessmentDetail.dimensions"),
    bars: buildAssessmentPosterBars("mbti", result.traits, t),
    extraLines: options?.parallelExtraLines,
    preloadedImageUrl: options?.preloadedImageUrl,
    imagePrompt: options?.imagePrompt,
    imageCacheKey: options?.imageCacheKey || `mbti-${result.mbtiType}`,
  };
}

export function buildEnneagramPosterConfig(
  result: {
    type: string | number;
    title: string;
    description: string;
    wing: string;
    coreFear: string;
    coreDesire: string;
    growthPath: string;
    stressArrow: string;
    advice: string;
    socialCaption: string;
    traits?: Record<string, number>;
  },
  t: TFunction,
  options?: {
    includeTraitBars?: boolean;
    preloadedImageUrl?: string;
    imagePrompt?: string;
  },
): PosterConfig {
  return {
    title: `Type ${result.type} · ${result.title}`,
    subtitle: `${t("assessmentFlow.enneagram.wing")}: ${result.wing}`,
    description: result.description,
    icon: "🎯",
    caption: result.socialCaption,
    accentColor: "#2dd4bf",
    accentColorLight: "#5eead4",
    bars: options?.includeTraitBars
      ? buildAssessmentPosterBars("enneagram", result.traits, t)
      : [],
    barsSectionTitle: t("assessmentDetail.dimensions"),
    extraLines: [
      `😨 ${t("assessmentFlow.enneagram.coreFear")}: ${result.coreFear}`,
      `💫 ${t("assessmentFlow.enneagram.coreDesire")}: ${result.coreDesire}`,
      `💡 ${t("assessmentFlow.enneagram.growth")}: ${result.growthPath}`,
      `⚡ ${t("assessmentFlow.enneagram.underStress")}: ${result.stressArrow}`,
      `🌱 ${result.advice}`,
    ],
    preloadedImageUrl: options?.preloadedImageUrl,
    imagePrompt: options?.imagePrompt,
    imageCacheKey: `enneagram-${result.type}`,
  };
}

export function buildEmotionPosterConfig(
  result: {
    emoji: string;
    emotionLevel: string;
    title: string;
    description?: string;
    profileHook?: string;
    profileBullets?: string[];
    traits: Record<string, number>;
    suggestions: string[];
    socialCaption: string;
  },
  t: TFunction,
  options?: {
    preloadedImageUrl?: string;
    imagePrompt?: string;
    imageCacheKey?: string;
  },
): PosterConfig {
  const profile = profileFields(result);
  return {
    title: result.title,
    subtitle: result.emotionLevel,
    ...profile,
    icon: result.emoji,
    caption: result.socialCaption,
    accentColor: "#e07a7a",
    accentColorLight: "#f0a0a0",
    barsSectionTitle: t("assessmentFlow.emotion.dimensions"),
    bars: buildAssessmentPosterBars("emotion", result.traits, t),
    extraLines: result.suggestions.map((s, i) => `${i + 1}. ${s}`),
    preloadedImageUrl: options?.preloadedImageUrl,
    imagePrompt: options?.imagePrompt,
    imageCacheKey: options?.imageCacheKey,
  };
}

export function buildZodiacPosterConfig(
  result: {
    zodiacSign: string;
    element: string;
    title: string;
    description: string;
    reading?: Parameters<typeof normalizeZodiacReading>[0]["reading"];
    traits: Record<string, number>;
    luckyItems: { color: string; number: string; direction: string };
    advice:
      | string
      | {
          mantra: string;
          doThis?: string[];
          avoidThis?: string[];
          luckyMoment?: string;
          crystalOrRitual?: string;
        };
    socialCaption: string;
  },
  t: TFunction,
  isZh: boolean,
  options?: {
    preloadedImageUrl?: string;
    imagePrompt?: string;
    imageCacheKey?: string;
  },
): PosterConfig {
  const reading = normalizeZodiacReading(result);
  const { profileHook, profileBullets } = zodiacReadingToPosterProfile(reading, (k) =>
    t(`assessmentDetail.dim.${k}`),
  );
  const advice = typeof result.advice === "string" ? null : result.advice;

  return {
    title: `${localizeZodiacName(result.zodiacSign, isZh)} · ${result.title}`,
    subtitle: `${localizeZodiacElement(result.element, isZh)}${t("assessmentFlow.zodiac.elementSuffix")}`,
    description: zodiacReadingToPlainText(reading) || result.description,
    profileHook,
    profileBullets,
    icon: getZodiacIcon(result.zodiacSign),
    caption: result.socialCaption,
    accentColor: "#8b6fcf",
    accentColorLight: "#b794f6",
    barsSectionTitle: t("assessmentDetail.dimensions"),
    bars: buildAssessmentPosterBars("zodiac", result.traits, t),
    extraLines: [
      `✨ ${t("assessmentFlow.zodiac.luckyGuide")}`,
      `🎨 ${t("assessmentFlow.zodiac.luckyColor")}：${result.luckyItems.color}`,
      `🔢 ${t("assessmentFlow.zodiac.luckyNumber")}：${result.luckyItems.number}`,
      `🧭 ${t("assessmentFlow.zodiac.luckyDirection")}：${result.luckyItems.direction}`,
      ...(advice?.mantra
        ? [`💡 ${t("assessmentFlow.zodiac.mantraTitle")}：「${advice.mantra}」`]
        : []),
    ],
    preloadedImageUrl: options?.preloadedImageUrl,
    imagePrompt: options?.imagePrompt,
    imageCacheKey: options?.imageCacheKey,
  };
}

export async function buildSavedAssessmentPosterConfig(
  type: string,
  d: Record<string, any>,
  t: TFunction,
  isZh: boolean,
): Promise<PosterConfig> {
  const typeLabel = t(`assessmentReports.labels.${type}`, { defaultValue: type });
  const iconMap: Record<string, string> = {
    mbti: "🧠",
    enneagram: "🎯",
    zodiac: "⭐",
    emotion: "🔥",
  };

  let preloadedImageUrl: string | undefined;
  if (type === "mbti" && d.mbtiType) {
    preloadedImageUrl = (await probeMbtiPosterCached(d.mbtiType)) || undefined;
  }
  if (type === "zodiac" && d.imageUrl && !String(d.imageUrl).startsWith("blob:")) {
    preloadedImageUrl = d.imageUrl;
  }

  if (type === "mbti") {
    return buildMbtiPosterConfig(
      {
        mbtiType: d.mbtiType,
        title: d.title,
        description: d.description,
        profileHook: d.profileHook,
        profileBullets: d.profileBullets,
        traits: d.traits,
        socialCaption: d.socialCaption || t("assessmentDetail.shareDescAI"),
      },
      t,
      {
        preloadedImageUrl,
        imageCacheKey: d.mbtiType ? `mbti-${d.mbtiType}` : undefined,
      },
    );
  }

  if (type === "enneagram") {
    const enneagramType = d.type ?? d.enneagramType ?? "?";
    return buildEnneagramPosterConfig(
      {
        type: enneagramType,
        title: d.title,
        description: d.description,
        wing: d.wing || "",
        coreFear: d.coreFear || "",
        coreDesire: d.coreDesire || "",
        growthPath: d.growthPath || "",
        stressArrow: d.stressArrow || "",
        advice: d.advice || "",
        socialCaption: d.socialCaption || t("assessmentDetail.shareDescAI"),
        traits: d.traits,
      },
      t,
      { includeTraitBars: true, preloadedImageUrl: d.imageUrl },
    );
  }

  if (type === "emotion") {
    const config = buildEmotionPosterConfig(
      {
        emoji: d.emoji || "🎭",
        emotionLevel: d.emotionLevel || "",
        title: d.title,
        description: d.description,
        profileHook: d.profileHook,
        profileBullets: d.profileBullets,
        traits: d.traits,
        suggestions: d.suggestions || [],
        socialCaption: d.socialCaption || t("assessmentDetail.shareDescAI"),
      },
      t,
      { preloadedImageUrl: d.imageUrl },
    );
    return {
      ...config,
      title: `${d.emoji || "🎭"} ${d.title}`,
    };
  }

  if (type === "zodiac") {
    return buildZodiacPosterConfig(
      {
        zodiacSign: d.zodiacSign,
        element: d.element,
        title: d.title,
        description: d.description,
        reading: d.reading,
        traits: d.traits,
        luckyItems: d.luckyItems,
        advice: d.advice,
        socialCaption: d.socialCaption || t("assessmentDetail.shareDescAI"),
      },
      t,
      isZh,
      {
        preloadedImageUrl,
        imageCacheKey: d.zodiacSign ? `zodiac_${String(d.zodiacSign).toLowerCase()}` : undefined,
      },
    );
  }

  const profile = profileFields(d);
  return {
    title: d.title || typeLabel,
    subtitle: typeLabel,
    ...profile,
    bars: buildAssessmentPosterBars(type, d.traits, t),
    barsSectionTitle: t("assessmentDetail.dimensions"),
    accentColor: "#8b5cf6",
    accentColorLight: "#a78bfa",
    icon: iconMap[type] || "✨",
    caption: d.socialCaption || t("assessmentDetail.shareDescAI"),
    preloadedImageUrl,
  };
}
