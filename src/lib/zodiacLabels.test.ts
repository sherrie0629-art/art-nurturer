import { describe, it, expect } from "vitest";
import {
  ZODIAC_SIGNS,
  localizeZodiacDate,
  localizeZodiacName,
  localizeZodiacElement,
  getZodiacIcon,
} from "./zodiacLabels";

describe("zodiacLabels", () => {
  it("ZODIAC_SIGNS has 12 signs with consistent icon/element", () => {
    expect(ZODIAC_SIGNS).toHaveLength(12);
    for (const sign of ZODIAC_SIGNS) {
      expect(getZodiacIcon(sign.name)).toBe(sign.icon);
      expect(["Fire", "Earth", "Air", "Water"]).toContain(sign.element);
    }
  });

  it("localizes sign names for zh", () => {
    expect(localizeZodiacName("Aries", true)).toBe("白羊座");
    expect(localizeZodiacName("Pisces", true)).toBe("双鱼座");
    expect(localizeZodiacName("Aries", false)).toBe("Aries");
  });

  it("localizes elements for zh", () => {
    expect(localizeZodiacElement("Fire", true)).toBe("火象");
    expect(localizeZodiacElement("Water", false)).toBe("Water");
  });

  it("localizes date ranges per locale", () => {
    expect(localizeZodiacDate("Gemini", true)).toMatch(/5\.21/);
    expect(localizeZodiacDate("Gemini", false)).toMatch(/May 21/);
  });

  it("returns fallback icon for unknown sign", () => {
    expect(getZodiacIcon("UnknownSign")).toBe("⭐");
  });

  it("every sign in picker has zh name and date", () => {
    for (const { name } of ZODIAC_SIGNS) {
      expect(localizeZodiacName(name, true)).not.toBe(name);
      expect(localizeZodiacDate(name, true)).toBeTruthy();
      expect(localizeZodiacDate(name, false)).toBeTruthy();
    }
  });
});
