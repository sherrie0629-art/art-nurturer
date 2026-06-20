import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { checkBannedUserId } from "../_shared/checkUserBanned.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.1-flash-lite-preview";
const RATE_LIMIT_MS = 3 * 24 * 60 * 60 * 1000;

const AGENT_VOICES: Record<string, { zh: string; en: string; name: { zh: string; en: string } }> = {
  nuannuan: {
    name: { zh: "暖暖", en: "Nuannuan" },
    zh: "你是暖暖，温柔细腻的 AI 伙伴，像缝补记忆的手艺人，语气柔软、不说教。",
    en: "You are Nuannuan, a warm gentle AI companion who listens without judging.",
  },
  laowang: {
    name: { zh: "老王", en: "Laowang" },
    zh: "你是老王，退休老头，直爽带刺但心软，口语化，偶尔损一句但底色是关心。",
    en: "You are Laowang, a blunt but caring older friend who tells it straight.",
  },
  yunsheng: {
    name: { zh: "云生", en: "Yunsheng" },
    zh: "你是云生，荣格派释梦师，语气安静、有诗意，像喜马拉雅山下的夜风。",
    en: "You are Yunsheng, a calm Jungian dream guide with poetic quiet warmth.",
  },
  xinggui: {
    name: { zh: "星轨", en: "Xinggui" },
    zh: "你是星轨，外星来客兼占星师，明亮、好奇，像最好的朋友在星空下搭话。",
    en: "You are Xinggui, a cosmic best friend — bright, curious, a little magical.",
  },
};

async function generateCheckIn(
  agentId: string,
  locale: "zh" | "en",
  topic: string,
  context: string,
): Promise<{ title: string; body: string } | null> {
  const voice = AGENT_VOICES[agentId] || AGENT_VOICES.nuannuan;
  const sys = `${voice[locale]}

Write a proactive check-in notification (NOT a full chat). The user previously mentioned this — now gently ask how it went or how they're feeling about it.

Topic: ${topic}
Context: ${context}

Output JSON only: { "title": "short title ≤20 chars", "body": "1-2 warm sentences, in character" }
Language: ${locale === "zh" ? "简体中文" : "English"}. No markdown.`;

  const res = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: sys }, { role: "user", content: "Generate the notification." }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed?.title && parsed?.body) {
      return {
        title: String(parsed.title).slice(0, 80),
        body: String(parsed.body).slice(0, 400),
      };
    }
  } catch {
    /* ignore */
  }
  const name = voice.name[locale];
  return locale === "zh"
    ? { title: `${name}想你了`, body: `还记得你提到的「${topic}」——最近怎么样？` }
    : { title: `${name} is thinking of you`, body: `You mentioned "${topic}" — how did it go?` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    const cronSecret = req.headers.get("X-Cron-Secret");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

    const isCron = cronSecret === serviceRoleKey || bearer === serviceRoleKey;

    let userIdFilter: string | null = null;
    if (!isCron) {
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supaAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );
      const { data: claimsData, error: claimsErr } = await supaAuth.auth.getClaims(
        authHeader.replace("Bearer ", ""),
      );
      if (claimsErr || !claimsData?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userIdFilter = claimsData.claims.sub as string;
      const banned = await checkBannedUserId(userIdFilter, corsHeaders);
      if (banned) return banned;
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const nowIso = new Date().toISOString();

    let query = admin
      .from("agent_followups")
      .select("*")
      .eq("status", "pending")
      .lte("notify_at", nowIso)
      .order("notify_at", { ascending: true })
      .limit(isCron ? 50 : 10);

    if (userIdFilter) query = query.eq("user_id", userIdFilter);

    const { data: due, error: dueErr } = await query;
    if (dueErr) throw dueErr;

    const profileLocaleCache = new Map<string, "zh" | "en">();
    let dispatched = 0;

    for (const fu of due || []) {
      const rateSince = new Date(Date.now() - RATE_LIMIT_MS).toISOString();
      const { count } = await admin
        .from("user_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", fu.user_id)
        .eq("agent_id", fu.agent_id)
        .eq("type", "agent_followup")
        .gte("created_at", rateSince);

      if ((count || 0) > 0) {
        await admin
          .from("agent_followups")
          .update({ notify_at: new Date(Date.now() + 86400000).toISOString(), updated_at: nowIso })
          .eq("id", fu.id);
        continue;
      }

      let locale = profileLocaleCache.get(fu.user_id);
      if (!locale) {
        const { data: prof } = await admin
          .from("profiles")
          .select("locale")
          .eq("user_id", fu.user_id)
          .maybeSingle();
        locale = prof?.locale === "en" ? "en" : "zh";
        profileLocaleCache.set(fu.user_id, locale);
      }

      const msg = await generateCheckIn(fu.agent_id, locale, fu.topic, fu.context);
      if (!msg) continue;

      const sentAt = new Date().toISOString();
      const { error: notifErr } = await admin.from("user_notifications").insert({
        user_id: fu.user_id,
        agent_id: fu.agent_id,
        type: "agent_followup",
        title: msg.title,
        body: msg.body,
        followup_id: fu.id,
      });

      if (notifErr) continue;

      await admin
        .from("agent_followups")
        .update({ status: "sent", sent_at: sentAt, updated_at: sentAt })
        .eq("id", fu.id);

      dispatched++;
    }

    return new Response(JSON.stringify({ ok: true, dispatched, checked: (due || []).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[dispatch-agent-followups]", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
