import { describe, it, expect, vi } from "vitest";
import {
  deriveCompatibilityRarity,
  compatibilityAccentColors,
  buildCompatibilityPosterConfig,
  RARITY_THEME,
} from "./compatibilityPoster";

const mockT = ((key: string, opts?: Record<string, unknown>) => {
  if (key === "assessmentFlow.compatibility.rarity.SSR") return "SSR级";
  if (key === "assessmentFlow.compatibility.fiveDimensions") return "五维";
  if (key === "assessmentFlow.compatibility.shareCaptionFallback")
    return `和 ${opts?.cp} 的缘分`;
  return key;
}) as import("i18next").TFunction;

describe("compatibilityPoster", () => {
  describe("deriveCompatibilityRarity", () => {
    it.each([
      [95, "SSR"],
      [88, "SSR"],
      [87, "SR"],
      [72, "SR"],
      [71, "R"],
      [55, "R"],
      [54, "N"],
      [0, "N"],
    ] as const)("score %i → %s", (score, rarity) => {
      expect(deriveCompatibilityRarity(score)).toBe(rarity);
    });
  });

  describe("compatibilityAccentColors", () => {
    it("returns distinct colors per rarity", () => {
      for (const rarity of ["SSR", "SR", "R", "N"] as const) {
        const colors = compatibilityAccentColors(rarity);
        expect(colors.accentColor).toMatch(/^#[0-9a-f]{6}$/i);
        expect(colors.accentColorLight).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  describe("RARITY_THEME", () => {
    it("defines theme for each rarity tier", () => {
      expect(Object.keys(RARITY_THEME).sort()).toEqual(["N", "R", "SR", "SSR"]);
    });
  });

  describe("buildCompatibilityPosterConfig", () => {
    const baseResult = {
      overallScore: 88,
      title: "灵魂共振",
      emoji: "💫",
      summary: "你们像两颗互相环绕的星。",
      dimensions: { trust: 8, spark: 12, harmony: 20 },
      tags: ["宿命", "互补"],
      keywords: ["默契"],
      prophecy: "未来可期",
    };

    it("builds WYSIWYG poster config mirroring destiny card", () => {
      const config = buildCompatibilityPosterConfig({
        result: baseResult,
        cpName: "小星",
        rarity: "SSR",
        dimLabels: { trust: "信任", spark: "火花", harmony: "和谐" },
        t: mockT,
      });

      expect(config.title).toBe("小星");
      expect(config.subtitle).toContain("88%");
      expect(config.subtitle).toContain("SSR级");
      expect(config.profileHook).toBe("灵魂共振");
      expect(config.icon).toBe("💫");
      expect(config.posterStyle).toBe("light");
      expect(config.bars).toHaveLength(3);
      // low raw scores should be normalized for visible bars
      expect(config.bars!.every((b) => b.value >= 25)).toBe(true);
      expect(config.extraLines).toEqual(
        expect.arrayContaining(["#宿命", "#互补", "🏷 默契", "🔮 未来可期"]),
      );
    });

    it("uses socialCaption when provided", () => {
      const config = buildCompatibilityPosterConfig({
        result: { ...baseResult, socialCaption: "自定义文案" },
        cpName: "A",
        rarity: "R",
        dimLabels: {},
        t: mockT,
      });
      expect(config.caption).toBe("自定义文案");
    });
  });
});
