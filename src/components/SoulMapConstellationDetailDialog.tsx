import { Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { AchievementDef } from "@/data/achievements";
import { agents } from "@/data/agents";
import { canonicalAgentId } from "@/lib/agentIdAliases";
import type { SoulFragmentData } from "@/lib/soulFragmentRules";
import { localizeAchievement } from "@/lib/localizeAchievement";
import {
  findRelatedFragments,
  formatUnlockDate,
  getAchievementUnlockDate,
  getMilestoneQuote,
} from "@/lib/constellationMilestone";
import { generateConstellationPoster } from "@/lib/constellationPoster";
import { SHARE_URL } from "@/lib/shareChannels";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Props {
  achievement: AchievementDef | null;
  unlockedIds: string[];
  unlockRecords: { achievement_id: string; created_at: string }[];
  fragments: SoulFragmentData[];
  onClose: () => void;
  onChat: (agentId: string) => void;
  onOpenFragment: (f: SoulFragmentData) => void;
  onShare: (imageDataUrl: string, title: string, desc: string, agentName?: string) => void;
}

const SoulMapConstellationDetailDialog = ({
  achievement,
  unlockedIds,
  unlockRecords,
  fragments,
  onClose,
  onChat,
  onOpenFragment,
  onShare,
}: Props) => {
  const { t, i18n } = useTranslation();

  if (!achievement) return null;

  const isUnlocked = unlockedIds.includes(achievement.id);
  const loc = localizeAchievement(achievement, t);
  const unlockDate = getAchievementUnlockDate(unlockRecords, achievement.id);
  const milestoneQuote = getMilestoneQuote(achievement, t);
  const related = isUnlocked ? findRelatedFragments(achievement, unlockDate, fragments) : [];
  const agent = achievement.agentId
    ? agents.find((a) => a.id === canonicalAgentId(achievement.agentId))
    : undefined;
  const isZh = i18n.language.startsWith("zh");

  const handleShare = async () => {
    if (!unlockDate) return;
    try {
      toast.info(t("soulMap.generatePoster"), { duration: 2500 });
      const canvas = await generateConstellationPoster({
        appName: t("home.appName"),
        sectionLabel: t("soulMap.title"),
        constellationName: loc.constellationName,
        milestoneQuote,
        unlockDate: t("soulMap.milestoneUnlockedAt", {
          date: formatUnlockDate(unlockDate, i18n.language),
        }),
        icon: achievement.icon,
        agentName: agent ? t(`agents.${agent.id}.name`, { defaultValue: agent.name }) : undefined,
        agentImageUrl: agent?.image,
        footerCta: t("soulMap.posterFooter"),
        shareUrl: SHARE_URL,
      });
      onShare(canvas.toDataURL("image/png"), loc.constellationName, milestoneQuote, agent?.name);
    } catch {
      toast.error(t("soulMap.posterFail"));
    }
  };

  return (
    <Dialog open={!!achievement} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <span className="text-3xl">{isUnlocked ? achievement.icon : "🔒"}</span>
          </div>
          <DialogTitle className="font-display text-lg">{loc.constellationName}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">{loc.description}</DialogDescription>
        </DialogHeader>

        {isUnlocked && (
          <>
            {unlockDate && (
              <p className="text-center text-[11px] text-muted-foreground">
                {t("soulMap.milestoneUnlockedAt", {
                  date: formatUnlockDate(unlockDate, i18n.language),
                })}
              </p>
            )}
            <blockquote
              className="rounded-2xl px-4 py-3 text-sm italic leading-relaxed text-foreground/85"
              style={{
                background: "hsl(var(--muted) / 0.45)",
                borderLeft: "3px solid hsl(38 75% 55% / 0.45)",
                fontFamily: isZh ? '"Noto Serif SC", serif' : "Georgia, serif",
              }}
            >
              {isZh ? `「${milestoneQuote}」` : `"${milestoneQuote}"`}
            </blockquote>

            {related.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("soulMap.relatedStars")}
                </p>
                {related.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFragment(f);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-left active:scale-[0.99] transition-transform"
                  >
                    <span className="text-base">{f.icon}</span>
                    <span className="flex-1 min-w-0 text-xs text-foreground/80 truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 rounded-2xl border border-border py-2.5 text-sm font-medium inline-flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                <Share2 className="h-4 w-4" />
                {t("soulMap.shareConstellation")}
              </button>
              {achievement.agentId && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onChat(achievement.agentId!);
                  }}
                  className="flex-1 rounded-2xl bg-gradient-golden py-2.5 text-sm font-medium text-primary-foreground active:scale-95 transition-transform"
                >
                  {t("soulMap.chat")} ✨
                </button>
              )}
            </div>
          </>
        )}

        {!isUnlocked && achievement.agentId && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onChat(achievement.agentId!);
              }}
              className="rounded-2xl bg-gradient-golden px-6 py-2.5 text-sm font-medium text-primary-foreground active:scale-95 transition-transform"
            >
              {t("soulMap.chat")} ✨
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SoulMapConstellationDetailDialog;
