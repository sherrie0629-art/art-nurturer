import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { SoulFragmentData } from "@/lib/soulFragmentRules";
import { formatMonthLabel, monthKey } from "@/lib/soulFragmentRules";
import SoulFragmentTimelineItem from "@/components/SoulFragmentTimelineItem";
import type { FragmentAction } from "@/components/SoulFragmentTimelineItem";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fragments: SoulFragmentData[];
  sourceLabels: Record<string, string>;
  fragmentSubtitle: (f: SoulFragmentData) => string | undefined;
  fragmentAction: (f: SoulFragmentData) => FragmentAction;
  onOpenFragment: (f: SoulFragmentData) => void;
}

const SoulMapAllStarsSheet = ({
  open,
  onOpenChange,
  fragments,
  sourceLabels,
  fragmentSubtitle,
  fragmentAction,
  onOpenFragment,
}: Props) => {
  const { t, i18n } = useTranslation();

  const byMonth = useMemo(() => {
    const groups = new Map<string, SoulFragmentData[]>();
    for (const f of fragments) {
      const key = monthKey(f.created_at);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(f);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [fragments]);

  let index = 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="font-display">{t("soulMap.allStarsTitle")}</SheetTitle>
          <SheetDescription>{t("soulMap.allStarsHint")}</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto max-h-[62vh] pb-6">
          {fragments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">{t("soulMap.summaryEmpty")}</p>
          ) : (
            byMonth.map(([key, items]) => (
              <div key={key} className="mb-4">
                <p className="text-[10px] font-medium text-muted-foreground mb-2 pl-1">
                  {formatMonthLabel(items[0].created_at, i18n.language)}
                </p>
                {items.map((f) => (
                  <SoulFragmentTimelineItem
                    key={f.id}
                    fragment={f}
                    index={index++}
                    sourceLabel={sourceLabels[f.source_type] || f.source_type}
                    subtitle={fragmentSubtitle(f)}
                    action={fragmentAction(f)}
                    onOpen={() => onOpenFragment(f)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SoulMapAllStarsSheet;
