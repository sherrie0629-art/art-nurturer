import type { TFunction } from "i18next";
import type { AchievementDef } from "@/data/achievements";
import type { SoulFragmentData } from "@/lib/soulFragmentRules";
import { canonicalAgentId } from "@/lib/agentIdAliases";
import { localizeAchievement } from "@/lib/localizeAchievement";

const RELATED_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function getAchievementUnlockDate(
  records: { achievement_id: string; created_at: string }[],
  achievementId: string,
): Date | null {
  const row = records.find((r) => r.achievement_id === achievementId);
  return row ? new Date(row.created_at) : null;
}

export function sortUnlockedAchievements(
  achievements: AchievementDef[],
  records: { achievement_id: string; created_at: string }[],
): AchievementDef[] {
  return [...achievements].sort((a, b) => {
    const aTime = getAchievementUnlockDate(records, a.id)?.getTime() ?? 0;
    const bTime = getAchievementUnlockDate(records, b.id)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

/** Light association: same agent + time proximity, else related source types. */
export function findRelatedFragments(
  achievement: AchievementDef,
  unlockDate: Date | null,
  fragments: SoulFragmentData[],
  max = 3,
): SoulFragmentData[] {
  if (fragments.length === 0) return [];

  const unlockTime = unlockDate?.getTime() ?? Date.now();

  const withinWindow = (f: SoulFragmentData) => {
    const t = new Date(f.created_at).getTime();
    return t <= unlockTime + 86_400_000 && unlockTime - t <= RELATED_WINDOW_MS;
  };

  let candidates = fragments.filter(withinWindow);

  if (achievement.agentId) {
    const agentId = canonicalAgentId(achievement.agentId);
    const agentMatches = candidates.filter(
      (f) => f.source_type === "chat" && canonicalAgentId(f.source_agent) === agentId,
    );
    if (agentMatches.length > 0) {
      candidates = agentMatches;
    } else {
      candidates = fragments.filter(
        (f) => f.source_type === "chat" && canonicalAgentId(f.source_agent) === agentId,
      );
    }
  } else {
    const sources = achievement.constellation.relatedSources;
    const sourceMatches = candidates.filter((f) => sources.includes(f.source_type));
    if (sourceMatches.length > 0) {
      candidates = sourceMatches;
    } else {
      candidates = fragments.filter((f) => sources.includes(f.source_type));
    }
  }

  return candidates
    .sort(
      (a, b) =>
        Math.abs(unlockTime - new Date(a.created_at).getTime()) -
        Math.abs(unlockTime - new Date(b.created_at).getTime()),
    )
    .slice(0, max);
}

export function getMilestoneQuote(ach: AchievementDef, t: TFunction): string {
  const loc = localizeAchievement(ach, t);
  return t(`achievements.items.${ach.id}.milestone`, {
    name: loc.constellationName,
    defaultValue: loc.description,
  });
}

export function formatUnlockDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale.startsWith("zh") ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
