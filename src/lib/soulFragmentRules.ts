/** Shared soul fragment row shape from Supabase. */
export interface SoulFragmentData {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  source_type: string;
  source_agent: string | null;
  created_at: string;
}

/** Chat soul fragments: one per 10 completed turns with an agent. */
export const CHAT_FRAGMENT_TURN_INTERVAL = 10;

export const ASSESSMENT_SOURCE_TYPES = ["mbti", "enneagram", "zodiac", "emotion"] as const;

export function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale.startsWith("zh") ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
  });
}
