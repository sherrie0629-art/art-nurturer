import type { TFunction } from "i18next";
import type { PosterConfig } from "@/hooks/useSharePoster";
import { normalizeTraitScores } from "@/lib/scoreNormalize";

export type CompatibilityRarity = "SSR" | "SR" | "R" | "N";

export interface CompatibilityPosterResult {
  overallScore: number;
  title: string;
  emoji: string;
  summary: string;
  cpName?: string;
  rarity?: CompatibilityRarity;
  tags?: string[];
  keywords?: string[];
  prophecy?: string;
  dimensions: Record<string, number>;
  socialCaption?: string;
}

/** Pastel card theme for on-screen destiny card — 文艺小清新 */
export interface DestinyCardTheme {
  from: string;
  to: string;
  border: string;
  fg: string;
  muted: string;
  score: string;
  badge: string;
  chip: string;
  glow: string;
  overlay: string;
}

export const RARITY_THEME: Record<CompatibilityRarity, DestinyCardTheme> = {
  SSR: {
    from: "from-[#faf6ee]",
    to: "to-[#f3e8dc]",
    border: "border-amber-200/50",
    fg: "text-stone-700",
    muted: "text-stone-500",
    score: "text-amber-800/90",
    badge: "bg-white/70 text-amber-900/80 border border-amber-100/80",
    chip: "bg-white/60 text-stone-600 border border-white/80",
    glow: "shadow-[0_8px_32px_rgba(196,167,120,0.18)]",
    overlay:
      "radial-gradient(circle at 28% 18%, rgba(251,236,210,0.55), transparent 42%), radial-gradient(circle at 72% 82%, rgba(245,220,200,0.35), transparent 40%)",
  },
  SR: {
    from: "from-[#f7f0ee]",
    to: "to-[#e8f0f4]",
    border: "border-rose-200/45",
    fg: "text-stone-700",
    muted: "text-stone-500",
    score: "text-rose-900/75",
    badge: "bg-white/70 text-rose-900/70 border border-rose-100/70",
    chip: "bg-white/55 text-stone-600 border border-white/75",
    glow: "shadow-[0_8px_32px_rgba(184,149,143,0.16)]",
    overlay:
      "radial-gradient(circle at 30% 20%, rgba(245,230,225,0.5), transparent 42%), radial-gradient(circle at 70% 78%, rgba(220,235,245,0.45), transparent 40%)",
  },
  R: {
    from: "from-[#eef4f0]",
    to: "to-[#e4edf5]",
    border: "border-sky-200/45",
    fg: "text-stone-700",
    muted: "text-stone-500",
    score: "text-sky-900/70",
    badge: "bg-white/70 text-sky-900/70 border border-sky-100/70",
    chip: "bg-white/55 text-stone-600 border border-white/75",
    glow: "shadow-[0_8px_32px_rgba(143,175,158,0.15)]",
    overlay:
      "radial-gradient(circle at 32% 22%, rgba(220,240,230,0.5), transparent 42%), radial-gradient(circle at 68% 80%, rgba(210,228,245,0.4), transparent 40%)",
  },
  N: {
    from: "from-[#f6f5f3]",
    to: "to-[#ebe9e6]",
    border: "border-stone-200/50",
    fg: "text-stone-600",
    muted: "text-stone-400",
    score: "text-stone-700/80",
    badge: "bg-white/65 text-stone-600 border border-stone-200/60",
    chip: "bg-white/50 text-stone-500 border border-white/70",
    glow: "shadow-[0_6px_24px_rgba(120,113,108,0.1)]",
    overlay:
      "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.55), transparent 42%), radial-gradient(circle at 70% 80%, rgba(230,228,225,0.35), transparent 40%)",
  },
};

export function deriveCompatibilityRarity(score: number): CompatibilityRarity {
  if (score >= 88) return "SSR";
  if (score >= 72) return "SR";
  if (score >= 55) return "R";
  return "N";
}

export function compatibilityAccentColors(rarity: CompatibilityRarity): {
  accentColor: string;
  accentColorLight: string;
} {
  switch (rarity) {
    case "SSR":
      return { accentColor: "#b8956a", accentColorLight: "#dcc9a8" };
    case "SR":
      return { accentColor: "#b8958f", accentColorLight: "#d4b8b2" };
    case "R":
      return { accentColor: "#8faf9e", accentColorLight: "#b8cfc4" };
    default:
      return { accentColor: "#a8a29e", accentColorLight: "#d6d3d1" };
  }
}

/** Shared WYSIWYG poster config — mirrors destiny card on result / detail pages. */
export function buildCompatibilityPosterConfig(input: {
  result: CompatibilityPosterResult;
  cpName: string;
  rarity: CompatibilityRarity;
  dimLabels: Record<string, string>;
  t: TFunction;
  caption?: string;
  appName?: string;
}): PosterConfig {
  const { result, cpName, rarity, dimLabels, t, caption, appName } = input;
  const colors = compatibilityAccentColors(rarity);
  const normalized = normalizeTraitScores(result.dimensions);
  const rarityLabel = t(`assessmentFlow.compatibility.rarity.${rarity}`);

  const extraLines: string[] = [];
  if (result.tags?.length) {
    extraLines.push(...result.tags.slice(0, 3).map((tag) => `#${tag}`));
  }
  if (result.keywords?.length) {
    extraLines.push(...result.keywords.map((k) => `🏷 ${k}`));
  }
  if (result.prophecy) {
    extraLines.push(`🔮 ${result.prophecy}`);
  }

  return {
    title: cpName,
    subtitle: `${result.overallScore}% · ${rarityLabel}`,
    description: result.summary,
    profileHook: result.title,
    profileBullets: result.summary ? [result.summary] : [],
    icon: result.emoji || "💕",
    caption:
      caption ||
      result.socialCaption ||
      t("assessmentFlow.compatibility.shareCaptionFallback", { cp: cpName }),
    barsSectionTitle: t("assessmentFlow.compatibility.fiveDimensions"),
    bars: Object.entries(normalized).map(([key, value]) => ({
      label1: dimLabels[key] || key,
      label2: "",
      value,
    })),
    extraLines: extraLines.length ? extraLines : undefined,
    appName: appName || "心灵密语 · 缘分配对",
    posterStyle: "light",
    ...colors,
  };
}
