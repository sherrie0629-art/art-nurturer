import { supabase } from "@/integrations/supabase/client";
import { agents } from "@/data/agents";

// Persist anonymous (not-logged-in) chat messages in the current browser so a refresh
// no longer wipes them, and so we can migrate them to the user's account after sign-in.

const KEY_PREFIX = "guestChat:v1:";
const MAX_MESSAGES_PER_AGENT = 200;

export interface GuestMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

interface GuestDraft {
  messages: GuestMessage[];
  updatedAt: number;
}

const storageKey = (agentId: string) => `${KEY_PREFIX}${agentId}`;

const safeGet = (k: string): string | null => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const safeSet = (k: string, v: string) => {
  try { localStorage.setItem(k, v); } catch { /* quota / disabled */ }
};
const safeRemove = (k: string) => {
  try { localStorage.removeItem(k); } catch { /* noop */ }
};

export function loadGuestDraft(agentId: string): GuestMessage[] {
  const raw = safeGet(storageKey(agentId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as GuestDraft;
    if (!parsed?.messages?.length) return [];
    return parsed.messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({
        id: m.id || `${m.role}-${m.createdAt || Date.now()}`,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt || Date.now(),
      }));
  } catch {
    safeRemove(storageKey(agentId));
    return [];
  }
}

export function saveGuestDraft(agentId: string, messages: GuestMessage[]) {
  const trimmed = messages.slice(-MAX_MESSAGES_PER_AGENT);
  const draft: GuestDraft = { messages: trimmed, updatedAt: Date.now() };
  safeSet(storageKey(agentId), JSON.stringify(draft));
}

export function clearGuestDraft(agentId: string) {
  safeRemove(storageKey(agentId));
}

function listAllGuestAgentIds(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(KEY_PREFIX)) ids.push(k.slice(KEY_PREFIX.length));
    }
  } catch { /* noop */ }
  return ids;
}

export interface MigrationResult {
  migrated: number;
  agentToConversation: Record<string, string>;
}

/**
 * Migrate all locally stored guest drafts into the authenticated user's account.
 * Each agent draft becomes one `conversations` row with the messages persisted under it.
 */
export async function migrateGuestChatsToAccount(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = { migrated: 0, agentToConversation: {} };
  const agentIds = listAllGuestAgentIds();
  if (agentIds.length === 0) return result;

  for (const agentId of agentIds) {
    const messages = loadGuestDraft(agentId);
    const hasUserTurn = messages.some((m) => m.role === "user" && m.content.trim().length > 0);
    if (!hasUserTurn) {
      clearGuestDraft(agentId);
      continue;
    }

    const agentMeta = agents.find((a) => a.id === agentId);
    const firstUser = messages.find((m) => m.role === "user");
    const title = (firstUser?.content?.trim().slice(0, 60)) || `Chat with ${agentMeta?.name || agentId}`;

    const { data: convData, error: convErr } = await supabase
      .from("conversations")
      .insert({ user_id: userId, agent_id: agentId, title })
      .select("id")
      .single();

    if (convErr || !convData) {
      console.error("[guestChat] create conversation failed", agentId, convErr);
      continue;
    }

    const rows = messages.map((m) => ({
      conversation_id: convData.id,
      role: m.role,
      content: m.content,
      created_at: new Date(m.createdAt || Date.now()).toISOString(),
    }));

    const { error: msgErr } = await supabase.from("chat_messages").insert(rows);
    if (msgErr) {
      console.error("[guestChat] insert messages failed", agentId, msgErr);
      continue;
    }

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convData.id);

    result.agentToConversation[agentId] = convData.id;
    result.migrated += 1;
    clearGuestDraft(agentId);
  }

  return result;
}

export const GUEST_MIGRATED_EVENT = "guestChat:migrated";

export interface GuestMigratedDetail {
  agentToConversation: Record<string, string>;
}
