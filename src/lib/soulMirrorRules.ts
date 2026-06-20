/** Soul mirror unlock & reminder cadence (chat turns with one agent). */
export const MIRROR_TURN_INTERVAL = 15;

export function mirrorPromptStorageKey(userId: string, agentId: string): string {
  return `soul_mirror_last_prompt_turn:${userId}:${agentId}`;
}

export function getLastMirrorPromptTurn(userId: string, agentId: string): number {
  const raw = localStorage.getItem(mirrorPromptStorageKey(userId, agentId));
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function markMirrorPrompted(userId: string, agentId: string, atTurn: number): void {
  localStorage.setItem(mirrorPromptStorageKey(userId, agentId), String(atTurn));
}

/** Highest milestone (15, 30, 45…) not yet prompted for this agent. */
export function getPendingMirrorMilestone(lastPromptTurn: number, currentTurns: number): number | null {
  if (currentTurns < MIRROR_TURN_INTERVAL) return null;
  const highest =
    Math.floor(currentTurns / MIRROR_TURN_INTERVAL) * MIRROR_TURN_INTERVAL;
  if (highest > lastPromptTurn) return highest;
  return null;
}

export function isMirrorUnlocked(totalTurns: number): boolean {
  return totalTurns >= MIRROR_TURN_INTERVAL;
}

/**
 * Returns the milestone turn count if the user just completed a round that
 * crosses a mirror prompt boundary (15, 30, 45…). Used after incrementTurn —
 * never on page load (avoids popping for historical turn counts).
 */
export function getMirrorPromptOnTurnComplete(
  lastPromptTurn: number,
  newTotalTurns: number,
): number | null {
  if (newTotalTurns < MIRROR_TURN_INTERVAL) return null;
  if (newTotalTurns % MIRROR_TURN_INTERVAL !== 0) return null;
  if (lastPromptTurn >= newTotalTurns) return null;
  return newTotalTurns;
}
