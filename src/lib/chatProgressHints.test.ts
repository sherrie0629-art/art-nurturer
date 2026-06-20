import { describe, it, expect } from "vitest";
import { getNextChatProgressHint } from "./chatProgressHints";

describe("chatProgressHints", () => {
  it("returns guest hint when not logged in", () => {
    expect(getNextChatProgressHint(5, 2, false)).toEqual({
      kind: "guest",
      turnsRemaining: 0,
    });
  });

  it("prioritizes lore level-up over mirror and fragment", () => {
    const hint = getNextChatProgressHint(4, 1, true);
    expect(hint?.kind).toBe("lore");
    expect(hint?.turnsRemaining).toBe(2);
    expect(hint?.nextBondLevel).toBe(2);
  });

  it("shows mirror hint at max bond when lore is complete", () => {
    const hint = getNextChatProgressHint(10, 10, true);
    expect(hint?.kind).toBe("mirror");
    expect(hint?.turnsRemaining).toBe(5);
  });

  it("computes first mirror milestone from zero turns", () => {
    const hint = getNextChatProgressHint(0, 1, true);
    expect(hint?.kind).toBe("lore");
    expect(hint?.turnsRemaining).toBe(6);
  });

  it("shows fragment cadence when at max bond and mirror turn aligns", () => {
    const hint = getNextChatProgressHint(15, 10, true);
    expect(hint?.kind).toBe("mirror");
    expect(hint?.turnsRemaining).toBe(15);
  });

  it("returns fragment hint when lore exhausted and mirror at boundary", () => {
    const hint = getNextChatProgressHint(20, 10, true);
    expect(hint?.kind).toBe("mirror");
    expect(hint?.turnsRemaining).toBe(10);
  });
});
