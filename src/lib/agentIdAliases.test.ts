import { describe, it, expect } from "vitest";
import { canonicalAgentId, bondForAgent } from "./agentIdAliases";

describe("agentIdAliases", () => {
  describe("canonicalAgentId", () => {
    it.each([
      ["barista", "nuannuan"],
      ["jax", "laowang"],
      ["mystic", "yunsheng"],
      ["bestie", "xinggui"],
      ["mentor", "xinggui"],
    ] as const)("maps legacy %s → %s", (legacy, canonical) => {
      expect(canonicalAgentId(legacy)).toBe(canonical);
    });

    it("passes through canonical ids unchanged", () => {
      expect(canonicalAgentId("nuannuan")).toBe("nuannuan");
      expect(canonicalAgentId("laowang")).toBe("laowang");
    });
  });

  describe("bondForAgent", () => {
    const row = (agent_id: string, total_turns: number, bond_level = 1) => ({
      agent_id,
      total_turns,
      bond_level,
      energy_bits: total_turns,
      easter_eggs_found: [] as string[],
    });

    it("finds bond by canonical id", () => {
      const bonds = [row("nuannuan", 20, 3)];
      expect(bondForAgent(bonds, "barista")?.total_turns).toBe(20);
    });

    it("returns undefined when no match", () => {
      expect(bondForAgent([row("laowang", 5)], "nuannuan")).toBeUndefined();
    });

    it("merges duplicate legacy + canonical rows", () => {
      const bonds = [
        row("barista", 10, 2),
        row("nuannuan", 20, 4),
      ];
      const merged = bondForAgent(bonds, "nuannuan");
      expect(merged).toMatchObject({
        agent_id: "nuannuan",
        total_turns: 30,
        bond_level: 4,
        energy_bits: 30,
      });
    });

    it("dedupes easter eggs when merging", () => {
      const bonds = [
        { ...row("barista", 5), easter_eggs_found: ["热可可"] },
        { ...row("nuannuan", 5), easter_eggs_found: ["热可可", "红伞"] },
      ];
      const merged = bondForAgent(bonds, "nuannuan");
      expect(merged?.easter_eggs_found.sort()).toEqual(["热可可", "红伞"]);
    });
  });
});
