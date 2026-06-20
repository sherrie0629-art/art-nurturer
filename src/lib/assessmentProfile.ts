export interface AssessmentProfile {
  hook: string;
  bullets: string[];
}

type ProfileSource = {
  description?: string;
  profileHook?: string;
  profileBullets?: string[];
};

/** Normalize structured profile or split legacy paragraph for display. */
export function normalizeAssessmentProfile(source: ProfileSource): AssessmentProfile {
  const hook = (source.profileHook || "").trim();
  const bullets = (source.profileBullets || []).map((b) => b.trim()).filter(Boolean).slice(0, 4);
  if (hook || bullets.length) {
    return { hook, bullets };
  }

  const desc = (source.description || "").trim();
  if (!desc) return { hook: "", bullets: [] };

  const sentences = desc
    .split(/(?<=[。！？!?])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length >= 2) {
    return {
      hook: sentences[0],
      bullets: sentences.slice(1, 5).map((s) => s.replace(/^[，、]\s*/, "")),
    };
  }

  if (desc.length <= 48) {
    return { hook: desc, bullets: [] };
  }

  const mid = Math.min(42, Math.floor(desc.length * 0.35));
  let splitAt = desc.indexOf("，", mid);
  if (splitAt < 0) splitAt = desc.indexOf("。", mid);
  if (splitAt < 0) splitAt = mid;

  const first = desc.slice(0, splitAt + 1).trim();
  const rest = desc.slice(splitAt + 1).trim();
  const chunks = rest
    .split(/[，；]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6)
    .slice(0, 4);

  return {
    hook: first,
    bullets: chunks.length ? chunks : rest ? [rest] : [],
  };
}

export function profileToPlainText(profile: AssessmentProfile): string {
  if (!profile.hook && !profile.bullets.length) return "";
  if (!profile.bullets.length) return profile.hook;
  return [profile.hook, ...profile.bullets.map((b) => `· ${b}`)].filter(Boolean).join("\n");
}

export function profileToPosterDescription(profile: AssessmentProfile): string {
  return profileToPlainText(profile) || "";
}
