import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ACHIEVEMENTS, type AchievementDef } from "@/data/achievements";
import { localizeAchievement } from "@/lib/localizeAchievement";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unlockedIds: string[];
  onSelect: (ach: AchievementDef) => void;
}

const SoulMapConstellationCatalogSheet = ({ open, onOpenChange, unlockedIds, onSelect }: Props) => {
  const { t } = useTranslation();
  const unlocked = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id));
  const locked = ACHIEVEMENTS.filter((a) => !unlockedIds.includes(a.id));

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88vh]">
        <DrawerHeader>
          <DrawerTitle>{t("soulMap.catalogTitle")}</DrawerTitle>
          <DrawerDescription>{t("soulMap.catalogHint")}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-5 pb-8">
          <div className="grid grid-cols-2 gap-3">
            {unlocked.map((ach, i) => {
              const loc = localizeAchievement(ach, t);
              return (
                <motion.button
                  key={ach.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    onOpenChange(false);
                    onSelect(ach);
                  }}
                  className="rounded-2xl p-4 text-left"
                  style={{
                    background: "linear-gradient(135deg, hsl(38 75% 55% / 0.12), hsl(25 85% 60% / 0.06))",
                    border: "1px solid hsl(38 75% 55% / 0.25)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{ach.icon}</span>
                    <span className="text-[10px] text-muted-foreground">{t("soulMap.constellationLit")}</span>
                  </div>
                  <p className="text-xs font-semibold">{loc.constellationName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{loc.name}</p>
                </motion.button>
              );
            })}
            {locked.map((ach, i) => {
              const loc = localizeAchievement(ach, t);
              return (
                <motion.button
                  key={ach.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (unlocked.length + i) * 0.04 }}
                  onClick={() => {
                    onOpenChange(false);
                    onSelect(ach);
                  }}
                  className="rounded-2xl p-4 text-left border border-dashed border-border"
                  style={{ background: "hsl(var(--muted) / 0.35)" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl opacity-30">🔒</span>
                    <span className="text-[10px] text-muted-foreground">{t("soulMap.constellationPending")}</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{loc.constellationName}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-1">{loc.description}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SoulMapConstellationCatalogSheet;
