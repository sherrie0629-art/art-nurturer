import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  ZODIAC_SIGNS,
  localizeZodiacDate,
  localizeZodiacElement,
  localizeZodiacName,
  type ZodiacElement,
} from "@/lib/zodiacLabels";

const ELEMENT_ORDER: ZodiacElement[] = ["Fire", "Earth", "Air", "Water"];

const ELEMENT_STYLE: Record<
  ZodiacElement,
  { emoji: string; row: string; card: string; glow: string; chip: string }
> = {
  Fire: {
    emoji: "🔥",
    row: "from-rose-warm/15 via-transparent to-transparent",
    card: "border-rose-warm/35 bg-gradient-to-br from-rose-warm/25 via-card/90 to-amber-500/10",
    glow: "shadow-[0_0_28px_-6px_hsl(350_50%_60%/0.55)]",
    chip: "data-[active=true]:border-rose-warm/50 data-[active=true]:bg-rose-warm/15",
  },
  Earth: {
    emoji: "🌿",
    row: "from-amber-600/12 via-transparent to-transparent",
    card: "border-amber-600/30 bg-gradient-to-br from-amber-600/20 via-card/90 to-teal/10",
    glow: "shadow-[0_0_28px_-6px_hsl(42_53%_54%/0.45)]",
    chip: "data-[active=true]:border-amber-600/50 data-[active=true]:bg-amber-600/15",
  },
  Air: {
    emoji: "🌬️",
    row: "from-lavender/15 via-transparent to-transparent",
    card: "border-lavender/35 bg-gradient-to-br from-lavender/25 via-card/90 to-indigo-light/10",
    glow: "shadow-[0_0_28px_-6px_hsl(260_35%_65%/0.45)]",
    chip: "data-[active=true]:border-lavender/50 data-[active=true]:bg-lavender/15",
  },
  Water: {
    emoji: "🌊",
    row: "from-indigo/15 via-transparent to-transparent",
    card: "border-indigo-light/35 bg-gradient-to-br from-indigo/30 via-card/90 to-violet-500/10",
    glow: "shadow-[0_0_28px_-6px_hsl(225_40%_50%/0.5)]",
    chip: "data-[active=true]:border-indigo-light/50 data-[active=true]:bg-indigo/15",
  },
};

interface Props {
  isZh: boolean;
  onBack: () => void;
  onSelect: (signName: string) => void;
}

function OrbitDecoration() {
  const dots = ZODIAC_SIGNS.map((s, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const r = 118;
    return {
      icon: s.icon,
      x: 140 + Math.cos(angle) * r,
      y: 140 + Math.sin(angle) * r,
    };
  });

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-28 -translate-x-1/2 h-[280px] w-[280px] opacity-[0.22]"
      animate={{ rotate: 360 }}
      transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
    >
      <svg viewBox="0 0 280 280" className="h-full w-full" aria-hidden>
        <circle cx="140" cy="140" r="118" fill="none" stroke="hsl(42 53% 54% / 0.25)" strokeWidth="1" strokeDasharray="4 8" />
        <circle cx="140" cy="140" r="88" fill="none" stroke="hsl(260 35% 65% / 0.15)" strokeWidth="0.75" />
        {dots.map((d, i) => (
          <text
            key={i}
            x={d.x}
            y={d.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(42 70% 75%)"
            fontSize="14"
          >
            {d.icon}
          </text>
        ))}
      </svg>
    </motion.div>
  );
}

export default function ZodiacSignPicker({ isZh, onBack, onSelect }: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | ZodiacElement>("all");

  const groups = useMemo(() => {
    return ELEMENT_ORDER.map((element) => ({
      element,
      signs: ZODIAC_SIGNS.filter((s) => s.element === element),
    })).filter((g) => filter === "all" || g.element === filter);
  }, [filter]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-calm pb-10">
      {/* Ambient stars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-gold-light/40"
            style={{
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 19 + 7) % 100}%`,
            }}
            animate={{ opacity: [0.2, 0.9, 0.2], scale: [1, 1.4, 1] }}
            transition={{ duration: 2.5 + (i % 5), repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
        <div className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-16 h-48 w-48 rounded-full bg-lavender/10 blur-3xl" />
      </div>

      <OrbitDecoration />

      <div className="relative z-10 flex items-center gap-3 px-4 py-3 pt-12">
        <button type="button" onClick={onBack} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-semibold text-foreground">{t("assessmentFlow.zodiac.title")}</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-5 pt-2"
      >
        <div className="mb-6 pl-1 pr-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary/80 mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            {t("assessmentFlow.zodiac.pickerEyebrow")}
          </p>
          <h1 className="font-display text-2xl font-bold leading-tight text-gradient-golden max-w-[16rem]">
            {t("assessmentFlow.zodiac.introTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
            {t("assessmentFlow.zodiac.introDesc")}
          </p>
          <p className="mt-3 text-[11px] text-gold-light/70 italic">{t("assessmentFlow.zodiac.pickerHint")}</p>
        </div>

        {/* Element filters */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            data-active={filter === "all"}
            onClick={() => setFilter("all")}
            className="shrink-0 rounded-full border border-border/80 bg-card/60 px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground transition data-[active=true]:border-primary/50 data-[active=true]:bg-primary/10 data-[active=true]:text-gold-light"
          >
            {t("assessmentFlow.zodiac.filterAll")}
          </button>
          {ELEMENT_ORDER.map((el) => (
            <button
              key={el}
              type="button"
              data-active={filter === el}
              onClick={() => setFilter(el)}
              className={`shrink-0 rounded-full border border-border/80 bg-card/60 px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground transition ${ELEMENT_STYLE[el].chip} data-[active=true]:text-gold-light`}
            >
              {ELEMENT_STYLE[el].emoji} {localizeZodiacElement(el, isZh)}
            </button>
          ))}
        </div>

        {/* Element rows — horizontal scroll constellations */}
        <div className="space-y-6">
          {groups.map(({ element, signs }, gi) => {
            const style = ELEMENT_STYLE[element];
            return (
              <motion.section
                key={element}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: gi * 0.06 }}
                className={`relative rounded-3xl border border-border/40 bg-gradient-to-r ${style.row} p-4 pt-3 overflow-hidden`}
              >
                <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80">
                      {style.emoji} {localizeZodiacElement(element, isZh)}
                    </p>
                    <p className="font-display text-sm font-semibold text-foreground/90">
                      {t(`assessmentFlow.zodiac.elementTagline.${element.toLowerCase()}`)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {signs.map((sign) => {
                    const globalIdx = ZODIAC_SIGNS.findIndex((s) => s.name === sign.name);
                    return (
                      <motion.button
                        key={sign.name}
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.03 * globalIdx }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelect(sign.name)}
                        className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-3.5 text-center backdrop-blur-sm transition active:opacity-90 ${style.card} ${style.glow}`}
                      >
                        <span className="text-[9px] text-muted-foreground/60 leading-none">
                          {localizeZodiacDate(sign.name, isZh)}
                        </span>
                        <span className="text-3xl leading-none">{sign.icon}</span>
                        <span className="font-display text-xs font-bold text-foreground leading-snug">
                          {localizeZodiacName(sign.name, isZh)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
