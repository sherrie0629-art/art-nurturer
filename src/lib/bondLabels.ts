import type { TFunction } from "i18next";
import { getBondLabelKey } from "@/data/agents";

export function getBondLabel(t: TFunction, level: number): string {
  return t(`home.bondLabels.${getBondLabelKey(level)}`);
}
