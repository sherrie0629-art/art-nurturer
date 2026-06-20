import { describe, it, expect } from "vitest";
import {
  CHAT_FRAGMENT_TURN_INTERVAL,
  ASSESSMENT_SOURCE_TYPES,
  monthKey,
  formatMonthLabel,
} from "./soulFragmentRules";

describe("soulFragmentRules", () => {
  it("chat fragment interval is 10 turns", () => {
    expect(CHAT_FRAGMENT_TURN_INTERVAL).toBe(10);
  });

  it("assessment source types cover core assessments", () => {
    expect(ASSESSMENT_SOURCE_TYPES).toEqual(["mbti", "enneagram", "zodiac", "emotion"]);
  });

  describe("monthKey", () => {
    it("formats ISO date as YYYY-MM", () => {
      expect(monthKey("2025-03-15T10:00:00.000Z")).toBe("2025-03");
      expect(monthKey("2024-12-01T00:00:00.000Z")).toBe("2024-12");
    });
  });

  describe("formatMonthLabel", () => {
    it("localizes month for zh and en", () => {
      const iso = "2025-06-15T12:00:00.000Z";
      expect(formatMonthLabel(iso, "zh-CN")).toMatch(/2025/);
      expect(formatMonthLabel(iso, "en-US")).toMatch(/2025/);
    });
  });
});
