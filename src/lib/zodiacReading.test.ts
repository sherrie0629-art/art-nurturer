import { describe, it, expect } from "vitest";
import {
  ZODIAC_READING_KEYS,
  normalizeZodiacReading,
  zodiacReadingToPlainText,
  zodiacReadingToPosterProfile,
} from "./zodiacReading";

const fullReading = {
  hook: "本周能量平稳向上。",
  cards: ZODIAC_READING_KEYS.map((key, i) => ({
    key,
    tag: `标签${i}`,
    line: `${key} 运势句子。`,
  })),
};

describe("zodiacReading", () => {
  describe("normalizeZodiacReading", () => {
    it("uses structured reading when hook + 4 cards present", () => {
      const result = normalizeZodiacReading({ reading: fullReading });
      expect(result.hook).toBe(fullReading.hook);
      expect(result.cards).toHaveLength(4);
      expect(result.cards.map((c) => c.key)).toEqual([...ZODIAC_READING_KEYS]);
    });

    it("returns empty when no description and incomplete reading", () => {
      expect(normalizeZodiacReading({ reading: { hook: "only hook" } })).toEqual({
        hook: "",
        cards: [],
      });
    });

    it("parses description into hook + categorized cards", () => {
      const desc =
        "本周整体不错。感情方面会有小惊喜。事业需要耐心。财运平稳，不宜冲动消费。";
      const result = normalizeZodiacReading({ description: desc });
      expect(result.hook).toContain("本周整体不错");
      expect(result.cards.some((c) => c.key === "love" && c.line.includes("感情"))).toBe(true);
      expect(result.cards.some((c) => c.key === "career" && c.line.includes("事业"))).toBe(true);
      expect(result.cards.some((c) => c.key === "fortune" && c.line.includes("财"))).toBe(true);
    });

    it("filters invalid card keys", () => {
      const result = normalizeZodiacReading({
        reading: {
          hook: "hook",
          cards: [
            { key: "overall" as const, tag: "", line: "ok" },
            { key: "invalid" as any, tag: "", line: "skip" },
            { key: "love" as const, tag: "", line: "ok" },
            { key: "career" as const, tag: "", line: "ok" },
            { key: "fortune" as const, tag: "", line: "ok" },
          ],
        },
      });
      expect(result.cards.every((c) => ZODIAC_READING_KEYS.includes(c.key))).toBe(true);
    });
  });

  describe("zodiacReadingToPlainText", () => {
    it("joins hook and card lines with tags", () => {
      const text = zodiacReadingToPlainText(fullReading);
      expect(text.split("\n")[0]).toBe(fullReading.hook);
      expect(text).toContain("标签0：overall 运势句子。");
    });

    it("returns empty string for empty reading", () => {
      expect(zodiacReadingToPlainText({ hook: "", cards: [] })).toBe("");
    });
  });

  describe("zodiacReadingToPosterProfile", () => {
    it("maps cards to poster bullets with emoji and labels", () => {
      const { profileHook, profileBullets } = zodiacReadingToPosterProfile(
        fullReading,
        (k) => `Dim-${k}`,
      );
      expect(profileHook).toBe(fullReading.hook);
      expect(profileBullets).toHaveLength(4);
      expect(profileBullets[0]).toMatch(/^✨ Dim-overall · 标签0 — overall 运势句子。$/);
      expect(profileBullets[1]).toMatch(/^💕 Dim-love/);
    });
  });
});
