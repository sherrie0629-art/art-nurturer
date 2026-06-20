import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export const ACCOUNT_SUSPENDED_ERROR = "account_suspended";
export const ACCOUNT_SUSPENDED_MESSAGE = "你的账号已被暂停使用，如有疑问请联系管理员。";

export function accountSuspendedResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: ACCOUNT_SUSPENDED_ERROR, message: ACCOUNT_SUSPENDED_MESSAGE }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

export async function isUserBanned(userId: string): Promise<boolean> {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data } = await admin
    .from("profiles")
    .select("is_banned")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data?.is_banned;
}

export async function checkBannedUserId(
  userId: string,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  if (await isUserBanned(userId)) return accountSuspendedResponse(corsHeaders);
  return null;
}
