import { useTranslation } from "react-i18next";
import { BOND_STAR_MAX, BOND_THRESHOLDS, getBondProgressInLevel, getBondStarCount } from "@/data/agents";
import { getBondLabel } from "@/lib/bondLabels";

interface BondIndicatorProps {
  level: number;
  totalTurns: number;
  energyBits?: number;
}

const BondIndicator = ({ level, totalTurns }: BondIndicatorProps) => {
  const { t } = useTranslation();
  const label = getBondLabel(t, level);
  const starCount = getBondStarCount(level);
  const progress = getBondProgressInLevel(level, totalTurns);
  const hasNextLevel = level < BOND_THRESHOLDS.length;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: BOND_STAR_MAX }, (_, i) => i + 1).map((i) => (
          <span key={i} className={`text-[10px] ${i <= starCount ? "opacity-100" : "opacity-20"}`}>
            ⭐
          </span>
        ))}
      </div>
      <span className="text-[10px] text-gold-light font-medium">{label}</span>
      {hasNextLevel && (
        <div className="h-1 w-8 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default BondIndicator;
