import { motion } from "framer-motion";
import { ChevronRight, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AchievementDef } from "@/data/achievements";
import { localizeAchievement } from "@/lib/localizeAchievement";
import { formatUnlockDate, getAchievementUnlockDate } from "@/lib/constellationMilestone";

interface Props {
  recentUnlocked: AchievementDef[];
  nextLocked?: AchievementDef;
  totalUnlocked: number;
  totalCount: number;
  unlockRecords: { achievement_id: string; created_at: string }[];
  onOpenAchievement: (ach: AchievementDef) => void;
  onOpenCatalog: () => void;
  onChatWithAgent?: (agentId: string) => void;
}

const SoulMapConstellationPreview = ({
  recentUnlocked,
  nextLocked,
  totalUnlocked,
  totalCount,
  unlockRecords,
  onOpenAchievement,
  onOpenCatalog,
  onChatWithAgent,
}: Props) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="px-5 mt-8 scroll-mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-white/50 flex items-center gap-1.5">
          <span>🌌</span>
          {t("soulMap.constellationSection")}
          <span className="text-[10px] text-white/30 ml-1">
            ({totalUnlocked}/{totalCount})
          </span>
        </h3>
      </div>

      {recentUnlocked.length > 0 ? (
        <div className="space-y-2">
          {recentUnlocked.map((ach, i) => {
            const loc = localizeAchievement(ach, t);
            const unlockDate = getAchievementUnlockDate(unlockRecords, ach.id);
            return (
              <motion.button
                key={ach.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onOpenAchievement(ach)}
                className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-left active:scale-[0.99] transition-transform"
                style={{
                  background: "linear-gradient(135deg, hsl(38 75% 55% / 0.14), hsl(25 85% 60% / 0.06))",
                  border: "1px solid hsl(38 75% 55% / 0.28)",
                }}
              >
                <span className="text-2xl shrink-0">{ach.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gold/80">{t("soulMap.constellationLit")}</p>
                  <p className="text-sm font-display font-semibold text-white/92 truncate">{loc.constellationName}</p>
                  <p className="text-[10px] text-white/45 mt-0.5 truncate">{loc.description}</p>
                  {unlockDate && (
                    <p className="text-[10px] text-white/35 mt-1">
                      {t("soulMap.milestoneUnlockedAt", {
                        date: formatUnlockDate(unlockDate, i18n.language),
                      })}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-white/25 shrink-0" />
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/12 p-4 text-center">
          <p className="text-xs text-white/35 leading-relaxed">{t("soulMap.constellationEmpty")}</p>
        </div>
      )}

      {nextLocked && (
        <div
          className="mt-3 rounded-2xl p-4"
          style={{
            background: "linear-gradient(135deg, hsl(260 35% 20% / 0.6), hsl(225 50% 18% / 0.4))",
            border: "1px solid hsl(260 35% 65% / 0.15)",
          }}
        >
          <h4 className="text-xs font-semibold text-white/60 mb-2">{t("soulMap.nextGoal")}</h4>
          {(() => {
            const loc = localizeAchievement(nextLocked, t);
            return (
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <Lock className="h-4 w-4 text-white/30" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 font-medium">{loc.constellationName}</p>
                  <p className="text-[10px] text-white/40 truncate">{loc.description}</p>
                </div>
                {nextLocked.agentId && onChatWithAgent && (
                  <button
                    type="button"
                    onClick={() => onChatWithAgent(nextLocked.agentId!)}
                    className="flex-shrink-0 rounded-full px-3 py-1 text-[10px] font-medium text-white/70 border border-white/15 active:scale-95 transition-transform"
                  >
                    {t("soulMap.chat")}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      <button
        type="button"
        onClick={onOpenCatalog}
        className="mt-3 w-full rounded-xl border border-white/12 py-2.5 text-[11px] font-medium text-white/60 active:scale-[0.98] transition-transform"
      >
        {t("soulMap.viewCatalog", { cur: totalUnlocked, total: totalCount })}
      </button>
    </div>
  );
};

export default SoulMapConstellationPreview;
