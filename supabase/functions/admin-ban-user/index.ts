import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const targetUserId = body?.user_id as string | undefined;
    const action = body?.action as "ban" | "unban" | undefined;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    if (!targetUserId || !action || !["ban", "unban"].includes(action)) {
      return new Response(JSON.stringify({ error: "user_id and action (ban|unban) required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (targetUserId === userData.user.id) {
      return new Response(JSON.stringify({ error: "不能封禁自己的账号" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: targetAdmin } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", targetUserId)
      .eq("role", "admin")
      .maybeSingle();
    if (targetAdmin) {
      return new Response(JSON.stringify({ error: "不能封禁其他管理员" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();

    if (action === "ban") {
      const { error: profileErr } = await admin
        .from("profiles")
        .update({
          is_banned: true,
          banned_at: now,
          banned_reason: reason || "管理员封禁",
        })
        .eq("user_id", targetUserId);
      if (profileErr) throw profileErr;

      await admin.auth.admin.updateUserById(targetUserId, { ban_duration: "876000h" });
    } else {
      const { error: profileErr } = await admin
        .from("profiles")
        .update({
          is_banned: false,
          banned_at: null,
          banned_reason: null,
        })
        .eq("user_id", targetUserId);
      if (profileErr) throw profileErr;

      await admin.auth.admin.updateUserById(targetUserId, { ban_duration: "none" });
    }

    return new Response(JSON.stringify({ ok: true, user_id: targetUserId, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
