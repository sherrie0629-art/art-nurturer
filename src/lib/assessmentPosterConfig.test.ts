import { describe, it, expect, vi } from "vitest";
import {
  buildMbtiPosterConfig,
  buildZodiacPosterConfig,
  buildEnneagramPosterConfig,
} from "./assessmentPosterConfig";

const mockT = ((key: string) => {
  const map: Record<string, string> = {
    "assessmentDetail.dimensions": "维度",
    "assessmentDetail.dim.overall": "整体",
    "assessmentDetail.dim.love": "爱情",
    "assessmentDetail.dim.career": "事业",
    "assessmentDetail.dim.fortune": "财运",
    "assessmentFlow.zodiac.elementSuffix": "星座",
    "assessmentFlow.zodiac.luckyGuide": "幸运指南",
    "assessmentFlow.zodiac.luckyColor": "幸运色",
    "assessmentFlow.zodiac.luckyNumber": "幸运数字",
    "assessmentFlow.zodiac.luckyDirection": "幸运方位",
    "assessmentFlow.zodiac.mantraTitle": "本周箴言",
    "assessmentFlow.enneagram.wing": "侧翼",
    "assessmentFlow.enneagram.coreFear": "核心恐惧",
    "assessmentFlow.enneagram.coreDesire": "核心欲望",
    "assessmentFlow.enneagram.growth": "成长路径",
    "assessmentFlow.enneagram.underStress": "压力反应",
  };
  return map[key] ?? key;
}) as import("i18next").TFunction;

describe("assessmentPosterConfig", () => {
  describe("buildMbtiPosterConfig", () => {
    it("sets title, bars, and cache key for WYSIWYG poster", () => {
      const config = buildMbtiPosterConfig(
        {
          mbtiType: "INFP",
          title: "调停者",
          description: "理想主义者",
          traits: { I: 70, N: 65, F: 80, P: 55 },
          socialCaption: "分享我的 MBTI",
        },
        mockT,
      );
      expect(config.title).toBe("INFP — 调停者");
      expect(config.subtitle).toBe("INFP");
      expect(config.icon).toBe("🧠");
      expect(config.barsSectionTitle).toBe("维度");
      expect(config.bars!.length).toBeGreaterThan(0);
      expect(config.imageCacheKey).toBe("mbti-INFP");
    });
  });

  describe("buildZodiacPosterConfig", () => {
    it("uses reading profile bullets and zodiac icon", () => {
      const config = buildZodiacPosterConfig(
        {
          zodiacSign: "Leo",
          element: "Fire",
          title: "王者气场",
          description: "fallback desc",
          reading: {
            hook: "本周狮子座能量高涨。",
            cards: [
              { key: "overall", tag: "综合", line: "整体顺利。" },
              { key: "love", tag: "爱", line: "桃花朵朵。" },
              { key: "career", tag: "事", line: "事业进阶。" },
              { key: "fortune", tag: "财", line: "财运亨通。" },
            ],
          },
          traits: { luck: 80, charm: 70 },
          luckyItems: { color: "金", number: "7", direction: "南" },
          advice: { mantra: "自信发光" },
          socialCaption: "我的星座运势",
        },
        mockT,
        true,
        { imageCacheKey: "zodiac_leo" },
      );

      expect(config.title).toContain("狮子座");
      expect(config.icon).toBe("♌");
      expect(config.profileHook).toBe("本周狮子座能量高涨。");
      expect(config.profileBullets!.length).toBe(4);
      expect(config.extraLines!.some((l) => l.includes("自信发光"))).toBe(true);
      expect(config.imageCacheKey).toBe("zodiac_leo");
    });
  });

  describe("buildEnneagramPosterConfig", () => {
    it("includes enneagram extra lines and optional trait bars", () => {
      const config = buildEnneagramPosterConfig(
        {
          type: 4,
          title: "Individualist",
          description: "desc",
          wing: "3w",
          coreFear: "无身份",
          coreDesire: "找到自我",
          growthPath: "向1成长",
          stressArrow: "向2压力",
          advice: "接纳情绪",
          socialCaption: "九型分享",
          traits: { depth: 10, mood: 15 },
        },
        mockT,
        { includeTraitBars: true },
      );

      expect(config.title).toContain("Type 4");
      expect(config.extraLines!.length).toBe(5);
      expect(config.bars!.length).toBeGreaterThan(0);
      expect(config.imageCacheKey).toBe("enneagram-4");
    });
  });
});
