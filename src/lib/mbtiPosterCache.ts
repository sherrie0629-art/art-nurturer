const VALID_MBTI = new Set([
  "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP",
]);

/** Public CDN URL for a pre-generated MBTI poster (mbti-poster-art bucket). */
export function getMbtiPosterPublicUrl(mbtiType: string): string | null {
  const type = mbtiType.toUpperCase().replace(/[^A-Z]/g, "");
  if (!VALID_MBTI.has(type)) return null;
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/mbti-poster-art/mbti-${type}.png`;
}

/** Returns the public URL if the object already exists in storage. */
export async function probeMbtiPosterCached(mbtiType: string): Promise<string | null> {
  const url = getMbtiPosterPublicUrl(mbtiType);
  if (!url) return null;
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.ok) return url;
  } catch {
    /* network error — fall through to edge function */
  }
  return null;
}
