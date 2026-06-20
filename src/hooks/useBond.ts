import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getBondLevel } from "@/data/agents";
import { bondForAgent, canonicalAgentId } from "@/lib/agentIdAliases";

interface BondState {
  bondLevel: number;
  totalTurns: number;
  easterEggsFound: string[];
}

interface AgentBondRow {
  agent_id: string;
  bond_level: number;
  total_turns: number;
  energy_bits: number;
  easter_eggs_found: string[] | unknown;
}

export function useBond(userId: string | undefined, agentId: string) {
  const [bond, setBond] = useState<BondState>({
    bondLevel: 1,
    totalTurns: 0,
    easterEggsFound: [],
  });
  const [pendingLevelUp, setPendingLevelUp] = useState<number | null>(null);
  const storageAgentIdRef = useRef(canonicalAgentId(agentId));

  useEffect(() => {
    storageAgentIdRef.current = canonicalAgentId(agentId);
  }, [agentId]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const canonical = canonicalAgentId(agentId);
      const { data: rows } = await supabase.from("agent_bonds").select("*").eq("user_id", userId);

      const matches = ((rows || []) as AgentBondRow[]).map((row) => ({
        ...row,
        easter_eggs_found: (row.easter_eggs_found as string[]) || [],
      }));

      const merged = bondForAgent(matches, agentId);
      if (merged) {
        const totalTurns = merged.total_turns;
        const bondLevel = getBondLevel(totalTurns);
        const easterEggsFound = merged.easter_eggs_found;

        setBond({ bondLevel, totalTurns, easterEggsFound });

        // Keep a single canonical row so turns are not split across legacy IDs.
        if (matches.some((row) => canonicalAgentId(row.agent_id) === canonical && row.agent_id !== canonical)) {
          await supabase
            .from("agent_bonds")
            .upsert(
              {
                user_id: userId,
                agent_id: canonical,
                total_turns: totalTurns,
                bond_level: bondLevel,
                energy_bits: merged.energy_bits,
                easter_eggs_found: easterEggsFound as any,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id,agent_id" },
            );

          const legacyIds = matches
            .filter((row) => canonicalAgentId(row.agent_id) === canonical && row.agent_id !== canonical)
            .map((row) => row.agent_id);

          if (legacyIds.length > 0) {
            await supabase.from("agent_bonds").delete().eq("user_id", userId).in("agent_id", legacyIds);
          }
        }
        return;
      }

      await supabase.from("agent_bonds").insert({
        user_id: userId,
        agent_id: canonical,
        bond_level: 1,
        total_turns: 0,
      });
    };
    load();
  }, [userId, agentId]);

  const incrementTurn = useCallback(async () => {
    if (!userId) return;

    const storageAgentId = storageAgentIdRef.current;
    const newTurns = bond.totalTurns + 1;
    const newLevel = getBondLevel(newTurns);
    const leveledUp = newLevel > bond.bondLevel;

    setBond((prev) => ({
      ...prev,
      totalTurns: newTurns,
      bondLevel: newLevel,
    }));

    if (leveledUp) setPendingLevelUp(newLevel);

    await supabase
      .from("agent_bonds")
      .update({
        total_turns: newTurns,
        bond_level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("agent_id", storageAgentId);
  }, [userId, bond.totalTurns, bond.bondLevel]);

  const recordEasterEgg = useCallback(
    async (trigger: string) => {
      if (!userId || bond.easterEggsFound.includes(trigger)) return;
      const updated = [...bond.easterEggsFound, trigger];
      setBond((prev) => ({ ...prev, easterEggsFound: updated }));

      await supabase
        .from("agent_bonds")
        .update({ easter_eggs_found: updated as any })
        .eq("user_id", userId)
        .eq("agent_id", storageAgentIdRef.current);
    },
    [userId, bond.easterEggsFound],
  );

  const dismissLevelUp = useCallback(() => setPendingLevelUp(null), []);

  return { ...bond, pendingLevelUp, incrementTurn, recordEasterEgg, dismissLevelUp };
}
