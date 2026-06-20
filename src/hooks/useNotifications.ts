import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserNotification {
  id: string;
  user_id: string;
  agent_id: string | null;
  type: string;
  title: string;
  body: string;
  followup_id: string | null;
  read_at: string | null;
  created_at: string;
}

let dispatchCooldownUntil = 0;

async function maybeDispatchFollowups() {
  if (Date.now() < dispatchCooldownUntil) return;
  dispatchCooldownUntil = Date.now() + 60_000;
  try {
    await supabase.functions.invoke("dispatch-agent-followups");
  } catch {
    /* tables may not exist locally */
  }
}

export function useNotifications(userId: string | undefined) {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    await maybeDispatchFollowups();
    const { data } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data as UserNotification[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = items.filter((n) => !n.read_at).length;

  const markRead = useCallback(
    async (id: string) => {
      if (!userId) return;
      const readAt = new Date().toISOString();
      await supabase.from("user_notifications").update({ read_at: readAt }).eq("id", id).eq("user_id", userId);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: readAt } : n)));
    },
    [userId],
  );

  const markAllRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return;
    const readAt = new Date().toISOString();
    await supabase
      .from("user_notifications")
      .update({ read_at: readAt })
      .eq("user_id", userId)
      .is("read_at", null);
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: readAt })));
  }, [userId, unreadCount]);

  return { items, loading, unreadCount, reload: load, markRead, markAllRead };
}
