export const ZODIAC_READING_KEYS = ["overall", "love", "career", "fortune"] as const;
export type ZodiacReadingKey = (typeof ZODIAC_READING_KEYS)[number];

export interface ZodiacReadingCard {
  key: ZodiacReadingKey;
  tag: string;
  line: string;
}

export interface ZodiacReading {
  hook: string;
  cards: ZodiacReadingCard[];
}

type ReadingSource = {
  reading?: Partial<ZodiacReading>;
  description?: string;
};

const KEY_HINTS: Record<ZodiacReadingKey, RegExp[]> = {
  overall: [/整体/i, /综合/i, /本周/i, /能量/i, /overall/i, /week/i],
  love: [/爱/i, /感情/i, /恋/i, /桃花/i, /love/i, /heart/i],
  career: [/事业/i, /工作/i, /职/i, /career/i, /work/i],
  fortune: [/财/i, /钱/i, /fortune/i, /money/i],
};

export function normalizeZodiacReading(source: ReadingSource): ZodiacReading {
  const hook = (source.reading?.hook || "").trim();
  const cards = (source.reading?.cards || [])
    .filter((c) => c?.key && c?.line)
    .map((c) => ({
      key: c.key as ZodiacReadingKey,
      tag: (c.tag || "").trim(),
      line: c.line.trim(),
    }))
    .filter((c) => ZODIAC_READING_KEYS.includes(c.key));

  if (hook && cards.length >= 4) {
    return {
      hook,
      cards: ZODIAC_READING_KEYS.map(
        (key) => cards.find((c) => c.key === key) || { key, tag: "", line: "" },
      ).filter((c) => c.line),
    };
  }

  const desc = (source.description || "").trim();
  if (!desc) return { hook: "", cards: [] };

  const sentences = desc
    .split(/(?<=[。！？!?])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const fallbackHook = sentences[0] || desc.slice(0, 36);
  const rest = sentences.slice(1);
  const bucket: Record<ZodiacReadingKey, string[]> = {
    overall: [],
    love: [],
    career: [],
    fortune: [],
  };

  for (const sentence of rest.length ? rest : [desc]) {
    let placed = false;
    for (const key of ZODIAC_READING_KEYS) {
      if (KEY_HINTS[key].some((re) => re.test(sentence))) {
        bucket[key].push(sentence);
        placed = true;
        break;
      }
    }
    if (!placed) bucket.overall.push(sentence);
  }

  const fallbackCards: ZodiacReadingCard[] = ZODIAC_READING_KEYS.map((key) => ({
    key,
    tag: "",
    line: bucket[key][0] || "",
  })).filter((c) => c.line);

  return { hook: fallbackHook, cards: fallbackCards };
}

export function zodiacReadingToPlainText(reading: ZodiacReading): string {
  if (!reading.hook && !reading.cards.length) return "";
  const lines = [reading.hook, ...reading.cards.map((c) => (c.tag ? `${c.tag}：${c.line}` : c.line))].filter(
    Boolean,
  );
  return lines.join("\n");
}

const POSTER_EMOJI: Record<ZodiacReadingKey, string> = {
  overall: "✨",
  love: "💕",
  career: "💼",
  fortune: "🪙",
};

/** Map on-screen reading cards → poster profile hook + bullets (WYSIWYG). */
export function zodiacReadingToPosterProfile(
  reading: ZodiacReading,
  labelFn: (key: ZodiacReadingKey) => string,
): { profileHook: string; profileBullets: string[] } {
  return {
    profileHook: reading.hook,
    profileBullets: reading.cards.map((c) => {
      const label = labelFn(c.key);
      const tag = c.tag ? ` · ${c.tag}` : "";
      return `${POSTER_EMOJI[c.key]} ${label}${tag} — ${c.line}`;
    }),
  };
}
