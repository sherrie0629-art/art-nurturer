import { useId } from "react";
import { motion } from "framer-motion";
import { normalizeTraitScores } from "@/lib/scoreNormalize";

export const ZODIAC_CARD_KEYS = ["overall", "love", "career", "fortune"] as const;

const CARD_EMOJI: Record<(typeof ZODIAC_CARD_KEYS)[number], string> = {
  overall: "✨",
  love: "💕",
  career: "💼",
  fortune: "🪙",
};

export interface FortuneCardDimension {
  key: string;
  label: string;
  value: number;
  emoji: string;
  featured?: boolean;
}

export function buildZodiacFortuneCards(
  traits: Record<string, number>,
  labelFn: (key: string) => string,
): FortuneCardDimension[] {
  const normalized = normalizeTraitScores(traits);
  return ZODIAC_CARD_KEYS.map((key) => ({
    key,
    label: labelFn(key),
    value: Math.min(100, Math.max(0, Math.round(normalized[key] ?? 0))),
    emoji: CARD_EMOJI[key],
    featured: key === "overall",
  }));
}

function RingGauge({
  value,
  size,
  stroke,
  gradientId,
  delay = 0,
}: {
  value: number;
  size: number;
  stroke: number;
  gradientId: string;
  delay?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="hsl(0 0% 16%)"
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay }}
      />
    </svg>
  );
}

interface Props {
  dimensions: FortuneCardDimension[];
}

const ZodiacFortuneCards = ({ dimensions }: Props) => {
  const uid = useId().replace(/:/g, "");
  const goldGrad = `zfc-gold-${uid}`;
  const mysticGrad = `zfc-mystic-${uid}`;

  return (
    <div>
      <svg width={0} height={0} className="absolute" aria-hidden>
        <defs>
          <linearGradient id={goldGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(42 70% 75%)" />
            <stop offset="100%" stopColor="hsl(42 53% 54%)" />
          </linearGradient>
          <linearGradient id={mysticGrad} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(260 35% 65%)" />
            <stop offset="100%" stopColor="hsl(350 50% 60%)" />
          </linearGradient>
        </defs>
      </svg>

      <div className="grid grid-cols-2 gap-3">
        {dimensions.map((dim, i) => {
          const featured = dim.featured ?? dim.key === "overall";
          const ringSize = featured ? 68 : 58;
          const stroke = featured ? 5 : 4;
          return (
            <motion.div
              key={dim.key}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 280, damping: 22 }}
              className={`relative flex flex-col items-center rounded-2xl border px-3 py-4 text-center ${
                featured
                  ? "border-gold/35 bg-gradient-to-br from-gold/10 via-card to-lavender/5 shadow-glow"
                  : "border-border/50 bg-muted/25 hover:border-lavender/30 hover:shadow-soft"
              }`}
            >
              {featured && (
                <span className="absolute top-2 right-2 rounded-full bg-gold/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-gold-light">
                  ★
                </span>
              )}
              <span className={`mb-2 leading-none ${featured ? "text-2xl" : "text-xl"}`}>{dim.emoji}</span>
              <div className="relative flex items-center justify-center">
                <RingGauge
                  value={dim.value}
                  size={ringSize}
                  stroke={stroke}
                  gradientId={featured ? goldGrad : mysticGrad}
                  delay={0.12 + i * 0.08}
                />
                <span
                  className={`absolute font-display font-bold tabular-nums ${
                    featured ? "text-lg text-gold-light" : "text-sm text-foreground"
                  }`}
                >
                  {dim.value}
                  <span className="text-[10px] font-semibold opacity-80">%</span>
                </span>
              </div>
              <p className="mt-2 text-[11px] font-medium text-foreground leading-tight">{dim.label}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ZodiacFortuneCards;
