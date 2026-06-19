import { supabase } from "@/integrations/supabase/client";

// Persist assessment results even when the user is not signed in (or when the
// AI edge function failed and we fell back to a locally-computed result).
// Anonymous results are stashed in localStorage and migrated into the
// assessment_results table the next time the user signs in, so nothing the
// user produced is silently lost.

const KEY = "guestAssessments:v1";
const MAX_QUEUE = 20;

export type AssessmentKind =
  | "mbti"
  | "enneagram"
  | "zodiac"
  | "emotion"
  | "compatibility";

interface GuestAssessment {
  id: string;
  assessment_type: AssessmentKind;
  result_data: any;
  created_at: number;
}

const safeGet = (): GuestAssessment[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GuestAssessment[]) : [];
  } catch {
    return [];
  }
};

const safeSet = (q: GuestAssessment[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(q.slice(-MAX_QUEUE)));
  } catch {
    /* quota / disabled */
  }
};

const safeClear = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
};

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Insert an assessment result into the DB if a user is signed in; otherwise
 * stash it locally so it can be migrated after sign-in. Returns the inserted
 * row id when persisted to the DB, otherwise null.
 */
export async function persistAssessmentResult(
  userId: string | null | undefined,
  type: AssessmentKind,
  resultData: any,
): Promise<string | null> {
  if (userId) {
    try {
      const { data, error } = await supabase
        .from("assessment_results")
        .insert({ user_id: userId, assessment_type: type, result_data: resultData })
        .select("id")
        .single();
      if (!error && data?.id) return data.id as string;
      // On error (e.g. transient 401 / RLS hiccup) fall through to stash so
      // the next sign-in or retry can migrate it.
      console.warn("[guestAssessment] direct insert failed, stashing", error);
    } catch (e) {
      console.warn("[guestAssessment] direct insert threw, stashing", e);
    }
  }
  const queue = safeGet();
  queue.push({
    id: genId(),
    assessment_type: type,
    result_data: resultData,
    created_at: Date.now(),
  });
  safeSet(queue);
  return null;
}

/**
 * Move any stashed guest assessments into the user's assessment_results table.
 * Called from AuthContext when a SIGNED_IN event fires.
 */
export async function migrateGuestAssessmentsToAccount(
  userId: string,
): Promise<{ migrated: number }> {
  const queue = safeGet();
  if (!queue.length) return { migrated: 0 };
  const rows = queue.map((q) => ({
    user_id: userId,
    assessment_type: q.assessment_type,
    result_data: q.result_data,
  }));
  const { error } = await supabase.from("assessment_results").insert(rows);
  if (error) {
    console.warn("[guestAssessment] migration failed", error);
    return { migrated: 0 };
  }
  safeClear();
  return { migrated: rows.length };
}