import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  MIRROR_TURN_INTERVAL,
  mirrorPromptStorageKey,
  getLastMirrorPromptTurn,
  markMirrorPrompted,
  getPendingMirrorMilestone,
  getMirrorPromptOnTurnComplete,
  isMirrorUnlocked,
} from "./soulMirrorRules";

describe("soulMirrorRules", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("MIRROR_TURN_INTERVAL", () => {
    it("is 15", () => {
      expect(MIRROR_TURN_INTERVAL).toBe(15);
    });
  });

  describe("mirrorPromptStorageKey", () => {
    it("scopes key by userId and agentId", () => {
      expect(mirrorPromptStorageKey("user-1", "nuannuan")).toBe(
        "soul_mirror_last_prompt_turn:user-1:nuannuan",
      );
    });
  });

  describe("getLastMirrorPromptTurn / markMirrorPrompted", () => {
    it("returns 0 when nothing stored", () => {
      expect(getLastMirrorPromptTurn("u1", "laowang")).toBe(0);
    });

    it("round-trips prompt turn via localStorage", () => {
      markMirrorPrompted("u1", "laowang", 15);
      expect(getLastMirrorPromptTurn("u1", "laowang")).toBe(15);
    });

    it("returns 0 for invalid stored value", () => {
      localStorage.setItem(mirrorPromptStorageKey("u1", "laowang"), "not-a-number");
      expect(getLastMirrorPromptTurn("u1", "laowang")).toBe(0);
    });
  });

  describe("isMirrorUnlocked", () => {
    it("is locked below 15 turns", () => {
      expect(isMirrorUnlocked(0)).toBe(false);
      expect(isMirrorUnlocked(14)).toBe(false);
    });

    it("unlocks at 15 turns", () => {
      expect(isMirrorUnlocked(15)).toBe(true);
      expect(isMirrorUnlocked(100)).toBe(true);
    });
  });

  describe("getPendingMirrorMilestone", () => {
    it("returns null when current turns below interval", () => {
      expect(getPendingMirrorMilestone(0, 0)).toBeNull();
      expect(getPendingMirrorMilestone(0, 14)).toBeNull();
    });

    it("prompts first milestone at 15 when never prompted", () => {
      expect(getPendingMirrorMilestone(0, 15)).toBe(15);
    });

    it("does not re-prompt between milestones (14 vs 15)", () => {
      expect(getPendingMirrorMilestone(15, 15)).toBeNull();
      expect(getPendingMirrorMilestone(15, 29)).toBeNull();
    });

    it("prompts again every 15 turns at 30, 45, …", () => {
      expect(getPendingMirrorMilestone(15, 30)).toBe(30);
      expect(getPendingMirrorMilestone(30, 45)).toBe(45);
      expect(getPendingMirrorMilestone(45, 60)).toBe(60);
    });

    it("returns highest unreached milestone when turns jump ahead", () => {
      // User skipped prompt UI but turns jumped to 47 — next pending is 45 if last was 30
      expect(getPendingMirrorMilestone(30, 47)).toBe(45);
    });

    it("returns null when last prompt already covers current milestone", () => {
      expect(getPendingMirrorMilestone(45, 47)).toBeNull();
    });
  });

  describe("getMirrorPromptOnTurnComplete", () => {
    it("does not prompt below 15 or on non-milestone turns", () => {
      expect(getMirrorPromptOnTurnComplete(0, 14)).toBeNull();
      expect(getMirrorPromptOnTurnComplete(0, 16)).toBeNull();
    });

    it("prompts only when exactly crossing 15, 30, …", () => {
      expect(getMirrorPromptOnTurnComplete(0, 15)).toBe(15);
      expect(getMirrorPromptOnTurnComplete(15, 30)).toBe(30);
    });

    it("does not re-prompt the same milestone", () => {
      expect(getMirrorPromptOnTurnComplete(15, 15)).toBeNull();
    });
  });
});
