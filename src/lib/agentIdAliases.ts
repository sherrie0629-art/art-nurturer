/** Legacy agent_id values still present in older rows. */
const LEGACY_AGENT_IDS: Record<string, string> = {
  barista: "nuannuan",
  jax: "laowang",
  mystic: "yunsheng",
  bestie: "xinggui",
  mentor: "xinggui",
};

interface AgentBondRow {
  agent_id: string;
  total_turns: number;
  bond_level: number;
  energy_bits: number;
  easter_eggs_found: string[];
}

export function canonicalAgentId(agentId: string): string {
  return LEGACY_AGENT_IDS[agentId] ?? agentId;
}

export function bondForAgent<T extends AgentBondRow>(bonds: T[], agentId: string): T | undefined {
  const canonical = canonicalAgentId(agentId);
  const matches = bonds.filter((b) => canonicalAgentId(b.agent_id) === canonical);
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];

  return matches.reduce((best, row) => ({
    ...best,
    agent_id: canonical,
    total_turns: best.total_turns + row.total_turns,
    bond_level: Math.max(best.bond_level, row.bond_level),
    energy_bits: best.energy_bits + row.energy_bits,
    easter_eggs_found: Array.from(new Set([...best.easter_eggs_found, ...row.easter_eggs_found])),
  }));
}
