import type { TFunction } from "i18next";
import { normalizeTraitScores } from "@/lib/scoreNormalize";

export interface PosterBar {
  label1: string;
  label2: string;
  value: number;
}

export function buildAssessmentPosterBars(
  type: string,
  traits: Record<string, number> | undefined,
  t: TFunction,
): PosterBar[] {
  if (!traits) return [];

  const normalized = normalizeTraitScores(traits);

  if (type === "mbti") {
    const dimEI = t("assessmentFlow.mbti.dim.ei", { returnObjects: true }) as string[];
    const dimSN = t("assessmentFlow.mbti.dim.sn", { returnObjects: true }) as string[];
    const dimTF = t("assessmentFlow.mbti.dim.tf", { returnObjects: true }) as string[];
    const dimJP = t("assessmentFlow.mbti.dim.jp", { returnObjects: true }) as string[];
    return [
      { label1: dimEI[0], label2: dimEI[1], value: normalized.E_I ?? 50 },
      { label1: dimSN[0], label2: dimSN[1], value: normalized.S_N ?? 50 },
      { label1: dimTF[0], label2: dimTF[1], value: normalized.T_F ?? 50 },
      { label1: dimJP[0], label2: dimJP[1], value: normalized.J_P ?? 50 },
    ];
  }

  if (type === "enneagram") {
    return [
      { label1: t("assessmentDetail.dim.thinking"), label2: "", value: normalized.selfAwareness ?? 50 },
      { label1: t("assessmentDetail.dim.feeling"), label2: "", value: normalized.empathy ?? 50 },
      { label1: t("assessmentDetail.dim.instinct"), label2: "", value: normalized.resilience ?? 50 },
      { label1: t("assessmentDetail.dim.growth"), label2: "", value: normalized.growth ?? 50 },
    ];
  }

  if (type === "zodiac") {
    return [
      { label1: t("assessmentDetail.dim.overall"), label2: "", value: normalized.overall ?? 50 },
      { label1: t("assessmentDetail.dim.love"), label2: "", value: normalized.love ?? 50 },
      { label1: t("assessmentDetail.dim.career"), label2: "", value: normalized.career ?? 50 },
      { label1: t("assessmentDetail.dim.fortune"), label2: "", value: normalized.fortune ?? 50 },
    ];
  }

  if (type === "emotion") {
    return [
      { label1: t("assessmentFlow.emotion.burnout"), label2: t("assessmentFlow.emotion.lowerIsBetter"), value: normalized.burnout ?? 50 },
      { label1: t("assessmentFlow.emotion.energy"), label2: "", value: normalized.energy ?? 50 },
      { label1: t("assessmentFlow.emotion.boundaries"), label2: "", value: normalized.boundaries ?? 50 },
      { label1: t("assessmentFlow.emotion.sleep"), label2: "", value: normalized.sleep ?? 50 },
    ];
  }

  return Object.entries(normalized).map(([k, v]) => ({
    label1: t(`assessmentDetail.dim.${k}`, { defaultValue: k }),
    label2: "",
    value: v,
  }));
}
