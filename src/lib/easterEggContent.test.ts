import { describe, it, expect } from "vitest";
import { agents } from "@/data/agents";
import {
  containsEasterEggMarker,
  matchEasterEggTrigger,
  sanitizeEasterEggReply,
  stripEasterEggBlock,
  dedupeEasterEggContent,
  EASTER_EGG_MARKER_ZH,
} from "./easterEggContent";

const laowang = agents.find((a) => a.id === "laowang")!;

describe("easterEggContent", () => {
  describe("containsEasterEggMarker", () => {
    it("detects zh and en markers", () => {
      expect(containsEasterEggMarker(`前文${EASTER_EGG_MARKER_ZH}后文`)).toBe(true);
      expect(containsEasterEggMarker("【🔮 Hidden Memory Unlocked】")).toBe(true);
      expect(containsEasterEggMarker("普通回复")).toBe(false);
    });
  });

  describe("matchEasterEggTrigger — laowang", () => {
    it("matches full phrase with 老王 prefix", () => {
      const hit = matchEasterEggTrigger("老王，你今天真帅！", laowang.easterEggs, []);
      expect(hit?.trigger).toBe("老王你今天真帅");
    });

    // Aliases explicitly include bare "你今天真帅" — product allows trigger without 老王 prefix
    it("also matches bare 你今天真帅 via aliases (intentional)", () => {
      const hit = matchEasterEggTrigger("你今天真帅", laowang.easterEggs, []);
      expect(hit?.trigger).toBe("老王你今天真帅");
    });

    it("does not match unrelated compliment without keyword", () => {
      expect(matchEasterEggTrigger("你好厉害啊", laowang.easterEggs, [])).toBeNull();
      expect(matchEasterEggTrigger("你真帅", laowang.easterEggs, [])).toBeNull();
    });

    it("skips already unlocked triggers", () => {
      const hit = matchEasterEggTrigger("老王你今天真帅", laowang.easterEggs, ["老王你今天真帅"]);
      expect(hit).toBeNull();
    });

    it("matches case-insensitively with punctuation stripped", () => {
      const hit = matchEasterEggTrigger("Hot Cocoa please", agents[0].easterEggs, []);
      expect(hit?.trigger).toBe("热可可");
    });
  });

  describe("sanitizeEasterEggReply", () => {
    const eggBlock = `${EASTER_EGG_MARKER_ZH}\n\n隐藏故事内容。`;

    it("passes through when no marker", () => {
      const r = sanitizeEasterEggReply("hi", "normal reply", laowang.easterEggs, []);
      expect(r).toEqual({ content: "normal reply", matched: null });
    });

    it("keeps egg content when user message matches trigger", () => {
      const raw = `铺垫\n\n${eggBlock}`;
      const r = sanitizeEasterEggReply("老王你今天真帅", raw, laowang.easterEggs, []);
      expect(r.matched?.trigger).toBe("老王你今天真帅");
      expect(r.content).toContain(EASTER_EGG_MARKER_ZH);
    });

    it("strips hallucinated egg block when user did not say keyword", () => {
      const raw = `正常回复一段。\n\n${eggBlock}`;
      const r = sanitizeEasterEggReply("今天天气不错", raw, laowang.easterEggs, []);
      expect(r.matched).toBeNull();
      expect(r.content).not.toContain(EASTER_EGG_MARKER_ZH);
      expect(r.content).toContain("正常回复");
    });
  });

  describe("stripEasterEggBlock", () => {
    it("removes marker and trailing egg story", () => {
      const raw = "可见部分。\n\n【🔮 隐藏记忆解锁】\n\n不应出现";
      expect(stripEasterEggBlock(raw)).toBe("可见部分。");
    });
  });

  describe("dedupeEasterEggContent", () => {
    it("removes duplicate paragraphs after marker", () => {
      const story = "同一段故事重复。";
      const raw = `${EASTER_EGG_MARKER_ZH}\n\n${story}\n\n${story}`;
      const out = dedupeEasterEggContent(raw);
      expect(out.split(story).length - 1).toBe(1);
    });
  });
});
