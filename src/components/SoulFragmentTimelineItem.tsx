import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SoulFragmentData } from "@/lib/soulFragmentRules";

export interface FragmentAction {
  label: string;
  onClick: () => void;
}

interface Props {
  fragment: SoulFragmentData;
  index: number;
  sourceLabel: string;
  subtitle?: string;
  action?: FragmentAction;
  onOpen: () => void;
}

const SoulFragmentTimelineItem = ({ fragment, index, sourceLabel, subtitle, action, onOpen }: Props) => {
  const { i18n } = useTranslation();
  const isZh = i18n.language.startsWith("zh");
  const dateStr = new Date(fragment.created_at).toLocaleDateString(isZh ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="relative flex gap-3 pl-1"
    >
      <div className="flex flex-col items-center pt-1">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
          style={{
            backgroundColor: `${fragment.color}22`,
            border: `1px solid ${fragment.color}40`,
            boxShadow: `0 0 12px -4px ${fragment.color}60`,
          }}
        >
          {fragment.icon}
        </div>
        <div className="mt-1 w-px flex-1 min-h-[12px] bg-white/10" />
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <button type="button" onClick={onOpen} className="w-full rounded-2xl p-3.5 text-left active:scale-[0.99] transition-transform"
          style={{
            background: `linear-gradient(135deg, ${fragment.color}10, hsl(225 45% 12% / 0.7))`,
            border: `1px solid ${fragment.color}25`,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-display font-semibold text-white/90">{fragment.name}</p>
              {subtitle && <p className="text-[10px] text-white/45 mt-0.5">{subtitle}</p>}
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] text-white/65"
              style={{ backgroundColor: `${fragment.color}18`, border: `1px solid ${fragment.color}28` }}
            >
              {sourceLabel}
            </span>
          </div>
          {fragment.description && (
            <p
              className="mt-2 text-xs italic leading-relaxed text-white/55 line-clamp-2"
              style={{ fontFamily: isZh ? '"Noto Serif SC", serif' : "Georgia, serif" }}
            >
              {isZh ? `「${fragment.description}」` : `"${fragment.description}"`}
            </p>
          )}
          <p className="mt-2 text-[10px] text-white/30">{dateStr}</p>
        </button>

        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium text-white/75 active:scale-95 transition-transform"
          >
            {action.label}
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default SoulFragmentTimelineItem;
