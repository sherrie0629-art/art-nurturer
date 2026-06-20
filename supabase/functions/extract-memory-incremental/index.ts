import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { checkBannedUserId } from "../_shared/checkUserBanned.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const EMBED_URL = "https://ai.gateway.lovable.dev/v1/embeddings";
const EMBED_MODEL = "openai/text-embedding-3-small";
const MODEL = "google/gemini-3.1-flash-lite-preview";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supaAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: claimsData, error: claimsErr } = await supaAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const bannedResponse = await checkBannedUserId(userId, corsHeaders);
    if (bannedResponse) return bannedResponse;

    const { recentMessages, agentId, locale } = await req.json();
    if (!Array.isArray(recentMessages) || recentMessages.length === 0 || !agentId) {
      return new Response(JSON.stringify({ error: "recentMessages and agentId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isZh = locale === "zh";
    const transcript = recentMessages
      .slice(-4) // last 2 turns max
      .map((m: any) => `${m.role}: ${m.content}`)
      .join("\n");

    const langInstr = isZh
      ? "所有 memory.content / profile_facts.value / emotion_tag / key 都用简体中文，key 用英文 snake_case（如 job, partner_name, fav_drink）。"
      : "Output all memory.content / profile_facts.value / emotion_tag in natural English. Use English snake_case for keys (e.g. job, partner_name, fav_drink).";

    const sys = `You are a precision memory extractor for an AI companion app. From the most recent user-assistant exchange, extract ONLY NEW information that would help the AI remember and personalize future conversations.

Two outputs:

1) memories[] — short-to-mid-term episodic memories (emotion, event, person, insight). Skip generic small talk. Skip preferences/identity (those go in profile_facts).
   - importance: 1=minor, 2=meaningful, 3=pivotal.
   - Each memory.content must be a self-contained sentence the AI can later reference naturally ("Last week you said …").

2) profile_facts[] — long-term, cross-conversation user facts the AI should always know:
   - category: identity (job, age, location, name), preference (likes, dislikes, taste), relationship (partner, family, friends with names), value (beliefs), goal (current ambitions).
   - Use stable English snake_case keys: job, partner_name, fav_drink, child_name, location, hobby, etc.
   - Only emit a fact if the USER said it (not the assistant). Skip if it's already obvious or trivial.
   - confidence 0.5–0.95 based on directness of statement.

3) followups[] — future events worth a proactive check-in notification from THIS agent later (trip, exam, interview, move, medical, big life event):
   - topic: short label (e.g. "挪威旅行", "final interview")
   - context: one sentence the agent can reference later
   - event_at: ISO8601 date if known, else null
   - notify_at: ISO8601 when to send check-in (e.g. trip return +7–14 days, exam +1 day). Must be in the future.
   - reason: trip_return_checkin | exam_followup | milestone | general_checkin
   - confidence 0.5–0.95
   - Only emit if user mentioned a concrete future plan or dated event. Skip vague wishes.

4) cancel_topics[] — if user cancels/reschedules, list topic strings to cancel pending followups (e.g. "挪威旅行").

If nothing new of value: return empty arrays.

${langInstr}`;

    const aiRes = await fetch(AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")!}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Recent exchange:\n${transcript}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_incremental_memory",
            description: "Persist new memories and profile facts extracted from the exchange.",
            parameters: {
              type: "object",
              properties: {
                memories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", enum: ["emotion", "event", "person", "insight"] },
                      content: { type: "string" },
                      emotion_tag: { type: "string" },
                      importance: { type: "number" },
                    },
                    required: ["category", "content", "importance"],
                  },
                },
                profile_facts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", enum: ["identity", "preference", "relationship", "value", "goal"] },
                      key: { type: "string" },
                      value: { type: "string" },
                      confidence: { type: "number" },
                    },
                    required: ["category", "key", "value"],
                  },
                },
                followups: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      topic: { type: "string" },
                      context: { type: "string" },
                      event_at: { type: "string" },
                      notify_at: { type: "string" },
                      reason: {
                        type: "string",
                        enum: ["trip_return_checkin", "exam_followup", "milestone", "general_checkin"],
                      },
                      confidence: { type: "number" },
                    },
                    required: ["topic", "context", "notify_at", "reason"],
                  },
                },
                cancel_topics: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["memories", "profile_facts", "followups", "cancel_topics"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_incremental_memory" } },
      }),
    });

    if (!aiRes.ok) {
      console.error("[extract-memory] AI error:", aiRes.status, await aiRes.text());
      return new Response(JSON.stringify({ ok: false, error: "AI error" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ ok: true, memories: 0, facts: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(toolCall.function.arguments || "{}");
    const memories = (args.memories || []) as any[];
    const facts = (args.profile_facts || []) as any[];
    const followups = (args.followups || []) as any[];
    const cancelTopics = (args.cancel_topics || []) as string[];

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const parseIso = (s: unknown): string | null => {
      if (typeof s !== "string" || !s.trim()) return null;
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    };

    if (cancelTopics.length > 0) {
      for (const raw of cancelTopics) {
        const topic = String(raw).trim().slice(0, 120);
        if (!topic) continue;
        await admin
          .from("agent_followups")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("agent_id", agentId)
          .eq("status", "pending")
          .ilike("topic", `%${topic.slice(0, 40)}%`);
      }
    }

    // Embed all new memory contents in a single batch
    let embeddings: number[][] = [];
    if (memories.length > 0) {
      try {
        const embRes = await fetch(EMBED_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")!}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: EMBED_MODEL,
            input: memories.map((m) => m.content.slice(0, 4000)),
            dimensions: 1536,
          }),
        });
        if (embRes.ok) {
          const j = await embRes.json();
          embeddings = (j.data || []).map((d: any) => d.embedding);
        }
      } catch (e) {
        console.error("[extract-memory] embedding failed:", e);
      }
    }

    if (memories.length > 0) {
      const rows = memories.map((m, i) => ({
        user_id: userId,
        agent_id: agentId,
        category: m.category,
        content: m.content,
        emotion_tag: m.emotion_tag || null,
        importance: Math.max(1, Math.min(3, Math.round(m.importance || 1))),
        embedding: embeddings[i] ? `[${embeddings[i].join(",")}]` : null,
      }));
      const { error } = await admin.from("user_memories").insert(rows);
      if (error) console.error("[extract-memory] insert memories:", error);
    }

    if (facts.length > 0) {
      const rows = facts
        .filter((f) => f.key && f.value)
        .map((f) => ({
          user_id: userId,
          category: f.category,
          key: String(f.key).toLowerCase().trim().slice(0, 80),
          value: String(f.value).slice(0, 500),
          confidence: Math.max(0.3, Math.min(0.95, Number(f.confidence) || 0.7)),
          source_agent_id: agentId,
          last_confirmed_at: new Date().toISOString(),
        }));
      if (rows.length > 0) {
        const { error } = await admin
          .from("user_profile_facts")
          .upsert(rows, { onConflict: "user_id,category,key" });
        if (error) console.error("[extract-memory] upsert facts:", error);
      }
    }

    let followupsScheduled = 0;
    const MIN_FOLLOWUP_CONFIDENCE = 0.75;
    const now = Date.now();
    for (const f of followups) {
      const topic = String(f.topic || "").trim().slice(0, 120);
      const context = String(f.context || "").trim().slice(0, 500);
      const confidence = Math.max(0, Math.min(1, Number(f.confidence) || 0.8));
      if (!topic || !context || confidence < MIN_FOLLOWUP_CONFIDENCE) continue;

      let notifyAt = parseIso(f.notify_at);
      if (!notifyAt) {
        notifyAt = new Date(now + 14 * 86400000).toISOString();
      }
      if (new Date(notifyAt).getTime() <= now + 86400000) continue;

      const eventAt = parseIso(f.event_at);
      const reason = ["trip_return_checkin", "exam_followup", "milestone", "general_checkin"].includes(f.reason)
        ? f.reason
        : "general_checkin";

      const { data: existing } = await admin
        .from("agent_followups")
        .select("id")
        .eq("user_id", userId)
        .eq("agent_id", agentId)
        .eq("status", "pending")
        .eq("topic", topic)
        .maybeSingle();

      if (existing?.id) {
        await admin
          .from("agent_followups")
          .update({
            context,
            event_at: eventAt,
            notify_at: notifyAt,
            reason,
            confidence,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        const { error: fuErr } = await admin.from("agent_followups").insert({
          user_id: userId,
          agent_id: agentId,
          topic,
          context,
          event_at: eventAt,
          notify_at: notifyAt,
          reason,
          confidence,
          status: "pending",
        });
        if (!fuErr) followupsScheduled++;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        memories: memories.length,
        facts: facts.length,
        followups: followupsScheduled,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("extract-memory error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
