import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SoulFragmentData } from "@/lib/soulFragmentRules";

interface Props {
  starCount: number;
  constellationCount: number;
  insight: string;
  latest?: SoulFragmentData;
  secondLatest?: SoulFragmentData;
  latestMeta?: string;
  secondMeta?: string;
  onOpenLatest: () => void;
  onOpenSecond?: () => void;
  onViewAll: () => void;
  onViewConstellations: () => void;
}

const SoulMapSummaryHero = ({
  starCount,
  constellationCount,
  insight,
  latest,
  secondLatest,
  latestMeta,
  secondMeta,
  onOpenLatest,
  onOpenSecond,
  onViewAll,
  onViewConstellations,
}: Props) => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith("zh");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mt-4 rounded-3xl p-5"
      style={{
        background: "linear-gradient(145deg, hsl(260 38% 22% / 0.85), hsl(225 48% 14% / 0.9))",
        border: "1px solid hsl(260 35% 65% / 0.2)",
        boxShadow: "0 0 40px -12px hsl(260 50% 50% / 0.35)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] text-white/45">{t("soulMap.summaryLabel")}</p>
          <p className="mt-1 font-display text-base font-semibold text-white/92">{t("soulMap.title")}</p>
        </div>
        <span className="text-[11px] text-white/50 shrink-0 pt-1">
          {t("soulMap.starsConst", { stars: starCount, c: constellationCount })}
        </span>
      </div>

      <p className="mt-3 text-[11px] text-white/40 leading-relaxed">{t("soulMap.summaryPurpose")}</p>

      <blockquote
        className="mt-4 rounded-2xl px-4 py-3 text-sm italic leading-relaxed text-white/70"
        style={{
          background: "hsl(225 45% 10% / 0.5)",
          borderLeft: "3px solid hsl(38 75% 55% / 0.5)",
          fontFamily: isZh ? '"Noto Serif SC", serif' : "Georgia, serif",
        }}
      >
        {isZh ? `「${insight}」` : `"${insight}"`}
      </blockquote>

      {latest ? (
        <button
          type="button"
          onClick={onOpenLatest}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl p-3.5 text-left active:scale-[0.99] transition-transform"
          style={{
            background: `linear-gradient(135deg, ${latest.color}18, hsl(225 45% 12% / 0.6))`,
            border: `1px solid ${latest.color}35`,
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
            style={{ backgroundColor: `${latest.color}25`, border: `1px solid ${latest.color}40` }}
          >
            {latest.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/45">{t("soulMap.summaryLatestLabel")}</p>
            <p className="text-sm font-display font-semibold text-white/90 truncate">{latest.name}</p>
            {latestMeta && <p className="text-[10px] text-white/40 mt-0.5 truncate">{latestMeta}</p>}
          </div>
          <ChevronRight className="h-4 w-4 text-white/30 shrink-0" />
        </button>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-4 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-white/25" />
          <p className="mt-2 text-xs text-white/35 leading-relaxed">{t("soulMap.summaryEmpty")}</p>
        </div>
      )}

      {secondLatest && onOpenSecond && (
        <button
          type="button"
          onClick={onOpenSecond}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left active:scale-[0.99] transition-transform bg-white/5 border border-white/8"
        >
          <span className="text-base">{secondLatest.icon}</span>
          <span className="flex-1 min-w-0 text-xs text-white/55 truncate">{secondLatest.name}</span>
          {secondMeta && <span className="text-[10px] text-white/30 shrink-0">{secondMeta}</span>}
        </button>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onViewAll}
          disabled={starCount === 0}
          className="flex-1 rounded-xl border border-white/15 py-2.5 text-[11px] font-medium text-white/75 active:scale-[0.98] transition-transform disabled:opacity-40"
        >
          {starCount > 0 ? t("soulMap.viewAllStars", { n: starCount }) : t("soulMap.viewAllStarsEmpty")}
        </button>
        <button
          type="button"
          onClick={onViewConstellations}
          className="flex-1 rounded-xl py-2.5 text-[11px] font-medium text-primary-foreground active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(135deg, hsl(38 75% 55%), hsl(25 85% 60%))" }}
        >
          {t("soulMap.viewConstellations")}
        </button>
      </div>
    </motion.div>
  );
};

export default SoulMapSummaryHero;
