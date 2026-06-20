const EASTER_EGG_MARKER_RE = /【🔮\s*(?:隐藏记忆解锁|Hidden Memory Unlocked)】/gi;

export function containsEasterEggMarker(content: string): boolean {
  EASTER_EGG_MARKER_RE.lastIndex = 0;
  return EASTER_EGG_MARKER_RE.test(content);
}

function normalizeForKeywordMatch(s: string): string {
  return s.toLowerCase().replace(/[\s,，。！？、；：""''「」!?;:'"]/g, "");
}

function messageContainsKeyword(message: string, keyword: string): boolean {
  if (!keyword.trim()) return false;
  return normalizeForKeywordMatch(message).includes(normalizeForKeywordMatch(keyword));
}

function normalizeForCompare(s: string): string {
  return s.replace(/[\s*「」""''\n]/g, "").toLowerCase();
}

function sharesStoryContent(before: string, after: string): boolean {
  if (!before || !after) return false;
  const na = normalizeForCompare(before);
  const nb = normalizeForCompare(after);
  if (nb.length >= 24 && na.includes(nb.slice(0, Math.min(36, nb.length)))) return true;

  const sentences = after.split(/[。！？\n]/).map((s) => s.trim()).filter((s) => s.length >= 8);
  let hits = 0;
  for (const s of sentences) {
    const key = normalizeForCompare(s).slice(0, 18);
    if (key.length >= 6 && na.includes(key)) hits++;
  }
  return hits >= 2;
}

function dedupeParagraphs(text: string): string {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of paragraphs) {
    const key = normalizeForCompare(p).slice(0, 48);
    if (key.length >= 8 && seen.has(key)) continue;
    if (key.length >= 8) seen.add(key);
    out.push(p);
  }
  return out.join("\n\n");
}

export function stripEasterEggBlock(raw: string): string {
  EASTER_EGG_MARKER_RE.lastIndex = 0;
  const match = EASTER_EGG_MARKER_RE.exec(raw);
  if (!match || match.index == null) return raw.trim();
  const before = raw.slice(0, match.index).trim();
  return before ? dedupeParagraphs(before) : "";
}

export function dedupeEasterEggContent(raw: string): string {
  const text = raw.trim();
  if (!text) return text;

  EASTER_EGG_MARKER_RE.lastIndex = 0;
  const markerMatches = [...text.matchAll(EASTER_EGG_MARKER_RE)];
  if (markerMatches.length === 0) {
    return dedupeParagraphs(text);
  }

  const marker = markerMatches[0][0];
  const firstIdx = markerMatches[0].index ?? 0;
  const before = text.slice(0, firstIdx).trim();

  let afterFirst = text.slice(firstIdx + marker.length).trim();
  if (markerMatches.length > 1) {
    const secondIdx = markerMatches[1].index ?? text.length;
    afterFirst = text.slice(firstIdx + marker.length, secondIdx).trim();
  }
  afterFirst = dedupeParagraphs(afterFirst);

  const eggBlock = `${marker}\n\n${afterFirst}`.trim();
  if (!before) return eggBlock;
  if (sharesStoryContent(before, afterFirst)) return eggBlock;
  if (before.length <= 72) return `${before}\n\n${eggBlock}`.trim();
  return eggBlock;
}

export function matchEasterEggTrigger(
  userText: string,
  eggs: { trigger: string; aliases?: string[]; response: string }[],
  unlockedTriggers: string[],
): { trigger: string; response: string } | null {
  for (const egg of eggs) {
    if (unlockedTriggers.includes(egg.trigger)) continue;
    const keywords = [egg.trigger, ...(egg.aliases || [])];
    if (keywords.some((k) => messageContainsKeyword(userText, k))) {
      return egg;
    }
  }
  return null;
}

export function sanitizeEasterEggReply(
  userText: string,
  assistantContent: string,
  eggs: { trigger: string; aliases?: string[]; response: string }[],
  unlockedTriggers: string[],
): { content: string; matched: { trigger: string; response: string } | null } {
  if (!containsEasterEggMarker(assistantContent)) {
    return { content: assistantContent, matched: null };
  }
  const matched = matchEasterEggTrigger(userText, eggs, unlockedTriggers);
  if (matched) {
    return { content: dedupeEasterEggContent(assistantContent), matched };
  }
  return { content: stripEasterEggBlock(assistantContent), matched: null };
}
