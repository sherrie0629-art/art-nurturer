import { motion } from "framer-motion";
import type { ZodiacReading, ZodiacReadingKey } from "@/lib/zodiacReading";

const CARD_EMOJI: Record<ZodiacReadingKey, string> = {
  overall: "✨",
  love: "💕",
  career: "💼",
  fortune: "🪙",
};

interface Props {
  reading: ZodiacReading;
  labelFn: (key: ZodiacReadingKey) => string;
  hookLabel?: string;
}

const ZodiacReadingCards = ({ reading, labelFn, hookLabel = "✦ vibe check" }: Props) => {
  if (!reading.hook && reading.cards.length === 0) return null;

  return (
    <div className="space-y-4">
      {reading.hook && (
        <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/10 via-card to-lavender/5 px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{hookLabel}</p>
          <p className="font-display text-[15px] font-semibold leading-snug text-foreground">{reading.hook}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {reading.cards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i }}
            className="rounded-xl border border-border/50 bg-muted/25 px-3.5 py-3"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base leading-none">{CARD_EMOJI[card.key]}</span>
              <span className="text-[11px] font-semibold text-foreground">{labelFn(card.key)}</span>
              {card.tag && (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {card.tag}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">{card.line}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ZodiacReadingCards;
