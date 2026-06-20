import { getBondTurnsToNextLevel } from "@/data/agents";
import { CHAT_FRAGMENT_TURN_INTERVAL } from "@/lib/soulFragmentRules";
import { MIRROR_TURN_INTERVAL } from "@/lib/soulMirrorRules";

export type ChatProgressHintKind = "guest" | "lore" | "mirror" | "fragment";

export interface ChatProgressHint {
  kind: ChatProgressHintKind;
  turnsRemaining: number;
  /** Next bond level unlocked by lore progression (kind === "lore"). */
  nextBondLevel?: number;
}

function turnsToNextInterval(totalTurns: number, interval: number): number {
  if (totalTurns <= 0) return interval;
  const next = Math.ceil((totalTurns + 1) / interval) * interval;
  return Math.max(0, next - totalTurns);
}

/**
 * Single next-milestone hint for the chat progress bar.
 * Priority: lore level-up → soul mirror cadence → soul fragment cadence.
 */
export function getNextChatProgressHint(
  totalTurns: number,
  bondLevel: number,
  isLoggedIn: boolean,
): ChatProgressHint | null {
  if (!isLoggedIn) {
    return { kind: "guest", turnsRemaining: 0 };
  }

  const loreTurns = getBondTurnsToNextLevel(bondLevel, totalTurns);
  if (loreTurns != null && loreTurns > 0) {
    return {
      kind: "lore",
      turnsRemaining: loreTurns,
      nextBondLevel: bondLevel + 1,
    };
  }

  if (totalTurns < MIRROR_TURN_INTERVAL) {
    return {
      kind: "mirror",
      turnsRemaining: MIRROR_TURN_INTERVAL - totalTurns,
    };
  }

  const mirrorTurns = turnsToNextInterval(totalTurns, MIRROR_TURN_INTERVAL);
  if (mirrorTurns > 0) {
    return { kind: "mirror", turnsRemaining: mirrorTurns };
  }

  const fragmentTurns = turnsToNextInterval(totalTurns, CHAT_FRAGMENT_TURN_INTERVAL);
  return { kind: "fragment", turnsRemaining: fragmentTurns };
}
