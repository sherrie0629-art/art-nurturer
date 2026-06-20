import { describe, it, expect } from "vitest";
import { normalizeTraitScores } from "./scoreNormalize";

describe("scoreNormalize", () => {
  it("returns null/undefined input unchanged", () => {
    expect(normalizeTraitScores(null)).toBeNull();
    expect(normalizeTraitScores(undefined)).toBeUndefined();
  });

  it("leaves scores unchanged when max >= 35", () => {
    const traits = { a: 40, b: 55, c: 72 };
    expect(normalizeTraitScores(traits)).toEqual(traits);
  });

  it("scales low scores so max maps to ~85 with floor 25", () => {
    const traits = { charm: 10, trust: 20, spark: 30 };
    const out = normalizeTraitScores(traits);
    expect(out.spark).toBe(85);
    expect(out.trust).toBeGreaterThanOrEqual(25);
    expect(out.charm).toBeGreaterThanOrEqual(25);
    // preserves relative ordering
    expect(out.charm).toBeLessThan(out.trust);
    expect(out.trust).toBeLessThan(out.spark);
  });

  it("caps scaled values at 95", () => {
    const traits = { only: 34 };
    const out = normalizeTraitScores(traits);
    expect(out.only).toBeLessThanOrEqual(95);
  });

  it("floors tiny outliers when max >= 35", () => {
    const traits = { strong: 60, weak: 5 };
    const out = normalizeTraitScores(traits);
    expect(out.strong).toBe(60);
    expect(out.weak).toBeGreaterThanOrEqual(15);
  });

  it("ignores non-numeric entries but keeps them in output", () => {
    const traits = { a: 10, b: NaN as unknown as number };
    const out = normalizeTraitScores(traits);
    expect(out.a).toBeGreaterThanOrEqual(25);
    expect(Number.isNaN(out.b)).toBe(true);
  });
});
