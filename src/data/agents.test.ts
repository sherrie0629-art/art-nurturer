import { describe, it, expect } from "vitest";
import {
  agents,
  BOND_THRESHOLDS,
  BOND_LABELS,
  BOND_LABEL_I18N_KEYS,
  BOND_STAR_MAX,
  getBondLevel,
  getBondStarCount,
  getBondLabelKey,
  getBondProgressInLevel,
  getBondTurnsToNextLevel,
} from "./agents";

describe("agents bond helpers", () => {
  it("defines 10 bond thresholds and matching labels", () => {
    expect(BOND_THRESHOLDS).toHaveLength(10);
    expect(BOND_LABELS).toHaveLength(10);
    expect(BOND_LABEL_I18N_KEYS).toHaveLength(10);
  });

  describe("getBondLevel", () => {
    it.each([
      [0, 1],
      [5, 1],
      [6, 2],
      [16, 3],
      [230, 10],
      [999, 10],
    ] as const)("totalTurns %i → level %i", (turns, level) => {
      expect(getBondLevel(turns)).toBe(level);
    });
  });

  describe("getBondStarCount", () => {
    it("maps 10 levels to 5 stars (ceil(level/2))", () => {
      expect(getBondStarCount(0)).toBe(0);
      expect(getBondStarCount(1)).toBe(1);
      expect(getBondStarCount(2)).toBe(1);
      expect(getBondStarCount(3)).toBe(2);
      expect(getBondStarCount(9)).toBe(5);
      expect(getBondStarCount(10)).toBe(5);
      expect(getBondStarCount(99)).toBe(BOND_STAR_MAX);
    });
  });

  describe("getBondLabelKey", () => {
    it("returns i18n key for level clamped to 1–10", () => {
      expect(getBondLabelKey(1)).toBe("stranger");
      expect(getBondLabelKey(10)).toBe("soulSymbiote");
      expect(getBondLabelKey(0)).toBe("stranger");
      expect(getBondLabelKey(100)).toBe("soulSymbiote");
    });
  });

  describe("getBondProgressInLevel", () => {
    it("returns 0% at level start and increases toward next threshold", () => {
      expect(getBondProgressInLevel(1, 0)).toBe(0);
      expect(getBondProgressInLevel(1, 3)).toBe(50); // 0→6, at 3
    });

    it("returns 100% at max level", () => {
      expect(getBondProgressInLevel(10, 500)).toBe(100);
    });
  });

  describe("getBondTurnsToNextLevel", () => {
    it("returns turns remaining until next threshold", () => {
      expect(getBondTurnsToNextLevel(1, 0)).toBe(6);
      expect(getBondTurnsToNextLevel(1, 4)).toBe(2);
    });

    it("returns null at max bond level", () => {
      expect(getBondTurnsToNextLevel(10, 300)).toBeNull();
    });
  });

  describe("agent lore consistency", () => {
    it("each agent has 10 lore entries aligned with bond levels", () => {
      for (const agent of agents) {
        expect(agent.lore).toHaveLength(10);
        expect(agent.lore.map((l) => l.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      }
    });

    it("each agent has at least one easter egg with trigger and response", () => {
      for (const agent of agents) {
        expect(agent.easterEggs.length).toBeGreaterThan(0);
        for (const egg of agent.easterEggs) {
          expect(egg.trigger).toBeTruthy();
          expect(egg.response).toContain("隐藏记忆解锁");
        }
      }
    });
  });
});
