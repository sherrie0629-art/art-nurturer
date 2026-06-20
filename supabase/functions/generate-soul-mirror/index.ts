// Generate Soul Mirror: 4 agents each generate a perspective on the user.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { checkBannedUserId } from "../_shared/checkUserBanned.ts";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_IMAGE_URL = "https://ai.gateway.lovable.dev/v1/images/generations";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AGENTS = [
  {
    id: "nuannuan",
    displayName: "暖暖",
    emoji: "🧵",
    lens:
      "the perspective of presence and emotional safety — what does this person carry quietly, what part of them needs to feel heard but rarely is",
  },
  {
    id: "laowang",
    displayName: "老王",
    emoji: "🍵",
    lens:
      "the perspective of how this person reacts under pressure — their strength, their tendency to brace, what battle they fight and where they could exhale",
  },
  {
    id: "yunsheng",
    displayName: "云生",
    emoji: "🌙",
    lens:
      "the symbolic / archetypal perspective — what cosmic patterns, mystical motifs, recurring archetypes echo through them",
  },
  {
    id: "xinggui",
    displayName: "星轨",
    emoji: "✨",
    lens:
      "the perspective of a best friend who delights in their quirks — what makes them lovable, magnetic, their hidden creative spark",
  },
] as const;

// Character-style image prompts (no humans/text) — pure stylized scenes that match each agent's vibe.
const AGENT_IMAGE_PROMPT: Record<string, string> = {
  nuannuan:
    "A warm cozy still life: a steaming vanilla latte in a ceramic mug on a wooden table, soft yarn ball, golden afternoon light through a window, dreamy japanese illustration style, warm amber and peach palette, gentle film grain.",
  laowang:
    "A quiet ink-wash scene: a hot tea cup steaming on a mossy stone, a single bamboo leaf, soft greys and deep ink greens, traditional chinese shuimo aesthetic, calm, meditative composition.",
  yunsheng:
    "A mystical celestial scene: a glowing crescent moon over a tranquil dark lake, scattered tarot cards floating, constellations and gold zodiac lines drawn over deep indigo and violet sky, ethereal fantasy illustration.",
  xinggui:
    "A dreamy synthwave landscape: neon star trails arcing across a magenta and electric purple horizon, glowing geometric ribbons, soft cyber-dreamcore aesthetic, no characters, vertical composition.",
};

const IMAGE_SUFFIX = " No text, no letters, no people, vertical portrait composition, soft cinematic lighting, ultra detailed.";

const FREE_LIMIT = 1;
const PRO_REGENERATE_INTERVAL_MS = 24 * 60 * 60 * 1000;

interface Perspective {
  agentId: string;
  displayName: string;
  emoji: string;
  portrait: string;
  signature: string;
  keywords: string[];
  tier: "unmet" | "glimpse" | "known";
  totalTurns: number;
}

function buildPrompt(
  agent: typeof AGENTS[number],
  ctx: {
    locale: "zh" | "en";
    nickname: string;
    mbti?: string | null;
    zodiac?: string | null;
    bondLevel: number;
    totalTurns: number;
    memories: string[];
    newMemories?: string[];
    edition?: number;
    profileFacts: string[];
  },
) {
  const lang = ctx.locale === "zh" ? "中文" : "English";
  // Tier-aware tone instructions
  let toneNote = "";
  let signatureNote = "";
  if (ctx.totalTurns === 0) {
    toneNote = ctx.locale === "zh"
      ? `重要：你和 ${ctx.nickname} **从未真正对话过**。请用「远观初见」的口吻写——基于下面给出的 MBTI / 星座 / 跨角色 facts 写一段坦诚的第一印象，开头自然带出类似「我们还没正式说过话，但远远看你……」的语气。**绝对不要**编造你们的共同记忆、过往对话或细节。承认这是初见。`
      : `IMPORTANT: You and ${ctx.nickname} have **never actually spoken**. Write in a "first glance from afar" voice — open with something like "We haven't really talked yet, but from a distance I see…" Base it on the MBTI / zodiac / cross-character facts below. **Do not** invent shared memories, past conversations, or specifics. Own that this is a first impression.`;
    signatureNote = ctx.locale === "zh"
      ? `signature 用一句带「初见」感的诗化短句。`
      : `signature should be a poetic one-liner that feels like a first glimpse.`;
  } else if (ctx.totalTurns < 6) {
    toneNote = ctx.locale === "zh"
      ? `你和 ${ctx.nickname} 只浅浅聊过几次。请用克制、留白的观察口吻，承认了解有限，不要假装很熟。`
      : `You and ${ctx.nickname} have only had a few light exchanges. Use a restrained, spacious observational voice; do not pretend to know them deeply.`;
  }

  const newMemoryNote = ctx.newMemories?.length
    ? ctx.locale === "zh"
      ? `\n- 这是第 ${ctx.edition ?? 2} 版镜像。下方「自上次镜像以来」的新记忆必须自然融入 portrait，至少引用 1 条，让用户感到被记住。`
      : `\n- This is mirror edition ${ctx.edition ?? 2}. Weave at least ONE item from NEW memories since last mirror into portrait — surprise them by remembering recent details.`
    : "";

  return [
    {
      role: "system",
      content: `You are ${agent.displayName}. Speak in ${lang} ONLY (no mixed language). You are writing one short reflection of how YOU see the user ${ctx.nickname}.

Lens: ${agent.lens}
${toneNote}
${signatureNote}${newMemoryNote}

Return STRICTLY a single valid JSON object — no markdown, no code fences, no commentary:
{
  "portrait": "120-180 ${ctx.locale === "zh" ? "字" : "characters/words"} of warm, specific, in-character second-person reflection ('You ...'). Sound like ${agent.displayName}'s voice. Avoid clichés. Reference concrete details below when possible.",
  "signature": "one poetic line ≤ 30 ${ctx.locale === "zh" ? "字" : "characters"} that captures them",
  "keywords": ["3 short tag-style ${lang} words/phrases that describe them"]
}`,
    },
    {
      role: "user",
      content: `User snapshot:
- Nickname: ${ctx.nickname}
- MBTI: ${ctx.mbti || "unknown"}
- Zodiac: ${ctx.zodiac || "unknown"}
- Bond with you: level ${ctx.bondLevel}, ${ctx.totalTurns} turns talked

Memories you (${agent.displayName}) have of them:
${ctx.memories.length ? ctx.memories.map((m, i) => `${i + 1}. ${m}`).join("\n") : "(few direct memories)"}
${
  ctx.newMemories?.length
    ? `\nNEW since last mirror (prioritize these):\n${ctx.newMemories.map((m, i) => `${i + 1}. ${m}`).join("\n")}`
    : ""
}

Cross-context facts about them:
${ctx.profileFacts.length ? ctx.profileFacts.map((f, i) => `${i + 1}. ${f}`).join("\n") : "(none)"}

Now write your JSON reflection.`,
    },
  ];
}

async function callAI(messages: any[]): Promise<any | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;

  const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
  for (const model of models) {
    try {
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.85,
          max_tokens: 600,
          response_format: { type: "json_object" },
        }),
      });
      if (res.status === 429 || res.status >= 500) continue;
      if (!res.ok) {
        console.error("[soul-mirror] AI status", res.status, await res.text());
        continue;
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) continue;
      try {
        return JSON.parse(text);
      } catch {
        const m = text.match(/\{[\s\S]*\}/);
        if (m) return JSON.parse(m[0]);
      }
    } catch (e) {
      console.error("[soul-mirror] AI err", e);
    }
  }
  return null;
}

function fallbackPerspective(agent: typeof AGENTS[number], locale: "zh" | "en"): Omit<Perspective, "agentId" | "displayName" | "emoji"> {
  if (locale === "zh") {
    return {
      portrait: `你身上有一种安静的力量——不张扬，却始终在场。我看你时，总觉得你在背后悄悄消化着许多事，又把最温柔的那一面留给世界。继续做你自己，那已经够好了。`,
      signature: `温柔且不动声色地存在着。`,
      keywords: ["沉静", "敏感", "韧性"],
    };
  }
  return {
    portrait: `There's a quiet strength to you — not loud, but steady. I notice how much you carry without making it anyone else's weight, and how gentle you stay anyway. Keep going. Just being you is already enough.`,
    signature: `Quietly luminous, steadily here.`,
    keywords: ["grounded", "sensitive", "resilient"],
  };
}

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
    const { data: claimsData, error: claimsErr } = await supaAuth.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const bannedResponse = await checkBannedUserId(userId, corsHeaders);
    if (bannedResponse) return bannedResponse;

    // --- Parse optional body ---
    let singleAgentId: string | null = null;
    try {
      const body = await req.json().catch(() => null);
      const aid = body?.agentId;
      if (typeof aid === "string" && AGENTS.some((a) => a.id === aid)) {
        singleAgentId = aid;
      }
    } catch { /* noop */ }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --- Subscription & quota ---
    const { data: sub } = await admin
      .from("user_subscriptions")
      .select("plan, expires_at")
      .eq("user_id", userId)
      .maybeSingle();
    const isPlus = true; // payments removed — all users treated as plus

    // --- Throttle: per-agent when singleAgentId, else global ---
    let existingQuery = admin
      .from("soul_mirrors")
      .select("id, created_at, user_snapshot")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    const { data: existingAll } = await existingQuery;
    const matchScope = (existingAll || []).filter((r: any) => {
      const snapAgent = r?.user_snapshot?.singleAgentId ?? null;
      return singleAgentId
        ? snapAgent === singleAgentId
        : !snapAgent; // global mode only collides with prior global mirrors
    });
    if (matchScope[0]) {
      const last = new Date(matchScope[0].created_at as string).getTime();
      const diff = Date.now() - last;
      if (diff < PRO_REGENERATE_INTERVAL_MS) {
        const hoursLeft = Math.ceil((PRO_REGENERATE_INTERVAL_MS - diff) / 3600000);
        return new Response(
          JSON.stringify({ error: "throttled", hoursLeft }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const lastMirror: any = matchScope[0] ?? null;
    const sinceIso = lastMirror?.created_at as string | undefined;
    const edition = lastMirror
      ? ((lastMirror.user_snapshot as any)?.edition ?? 1) + 1
      : 1;

    // --- Gather user context ---
    const [profileRes, bondsRes, factsRes, assessRes] = await Promise.all([
      admin.from("profiles").select("display_name, locale").eq("user_id", userId).maybeSingle(),
      admin.from("agent_bonds").select("agent_id, bond_level, total_turns").eq("user_id", userId),
      admin.from("user_profile_facts").select("category, key, value").eq("user_id", userId).gte("confidence", 0.6).limit(20),
      admin.from("assessment_results").select("assessment_type, result_data, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    const profile: any = profileRes.data || {};
    const assessMap: Record<string, any> = {};
    for (const r of (assessRes.data as any[] || [])) {
      if (!assessMap[r.assessment_type]) assessMap[r.assessment_type] = r.result_data;
    }
    const mbti = assessMap["mbti"]?.type || assessMap["mbti"]?.mbti || null;
    const zodiac = assessMap["zodiac"]?.sign || assessMap["zodiac"]?.zodiac || null;
    const bondsMap: Record<string, { bond_level: number; total_turns: number }> = {};
    for (const b of (bondsRes.data as any[] || [])) {
      bondsMap[b.agent_id] = { bond_level: b.bond_level || 1, total_turns: b.total_turns || 0 };
    }

    const MIRROR_MIN_TURNS = 15;
    if (singleAgentId) {
      const turns = bondsMap[singleAgentId]?.total_turns ?? 0;
      if (turns < MIRROR_MIN_TURNS) {
        return new Response(
          JSON.stringify({ error: "insufficient_turns", minTurns: MIRROR_MIN_TURNS, currentTurns: turns }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      const maxTurns = Math.max(0, ...Object.values(bondsMap).map((b) => b.total_turns));
      if (maxTurns < MIRROR_MIN_TURNS) {
        return new Response(
          JSON.stringify({ error: "insufficient_turns", minTurns: MIRROR_MIN_TURNS, currentTurns: maxTurns }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const profileFacts = (factsRes.data as any[] || []).map(
      (f) => `[${f.category}] ${f.key}: ${f.value}`,
    );

    const locale: "zh" | "en" = profile.locale === "en" ? "en" : "zh";
    const nickname = profile.display_name || (locale === "zh" ? "你" : "you");

    // --- Per-agent memories (top 8 by importance) ---
    const targetAgents = singleAgentId
      ? AGENTS.filter((a) => a.id === singleAgentId)
      : [...AGENTS];
    const memoriesPerAgent: Record<string, string[]> = {};
    const newMemoriesPerAgent: Record<string, string[]> = {};
    const highlights: Array<{ text: string; agentId: string; category?: string }> = [];
    await Promise.all(
      targetAgents.map(async (a) => {
        const { data } = await admin
          .from("user_memories")
          .select("content")
          .eq("user_id", userId)
          .eq("agent_id", a.id)
          .order("importance", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(8);
        memoriesPerAgent[a.id] = (data as any[] || []).map((m) => m.content).filter(Boolean);

        if (sinceIso) {
          const { data: delta } = await admin
            .from("user_memories")
            .select("content, category")
            .eq("user_id", userId)
            .eq("agent_id", a.id)
            .gt("created_at", sinceIso)
            .order("importance", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(5);
          const rows = (delta as any[] || []).filter((m) => m.content);
          newMemoriesPerAgent[a.id] = rows.map((m) => String(m.content));
          for (const m of rows.slice(0, 2)) {
            highlights.push({
              text: String(m.content).slice(0, 120),
              agentId: a.id,
              category: m.category,
            });
          }
        }
      }),
    );

    // --- AI calls (1 or 4 in parallel) ---
    const results = await Promise.all(
      targetAgents.map(async (agent) => {
        const bond = bondsMap[agent.id] || { bond_level: 1, total_turns: 0 };
        const messages = buildPrompt(agent, {
          locale,
          nickname,
          mbti,
          zodiac,
          bondLevel: bond.bond_level,
          totalTurns: bond.total_turns,
          memories: memoriesPerAgent[agent.id] || [],
          newMemories: newMemoriesPerAgent[agent.id] || [],
          edition,
          profileFacts,
        });
        const json = await callAI(messages);
        const fb = fallbackPerspective(agent, locale);
        const portrait = (json?.portrait && typeof json.portrait === "string") ? json.portrait.trim() : fb.portrait;
        const signature = (json?.signature && typeof json.signature === "string") ? json.signature.trim() : fb.signature;
        const keywords = Array.isArray(json?.keywords) && json.keywords.length
          ? json.keywords.slice(0, 3).map((k: any) => String(k).trim()).filter(Boolean)
          : fb.keywords;
        return {
          agentId: agent.id,
          displayName: agent.displayName,
          emoji: agent.emoji,
          portrait: portrait.slice(0, 280),
          signature: signature.slice(0, 60),
          keywords: keywords.slice(0, 3),
          tier: bond.total_turns === 0 ? "unmet" : bond.total_turns < 6 ? "glimpse" : "known",
          totalTurns: bond.total_turns,
        } as Perspective;
      }),
    );

    // --- Pick primary agent ---
    let primaryAgentId: string | null = null;
    let primaryTurns = 0;
    if (singleAgentId) {
      primaryAgentId = singleAgentId;
      primaryTurns = results[0]?.totalTurns ?? 0;
    } else {
      for (const p of results) {
        const memCount = (memoriesPerAgent[p.agentId] || []).length;
        const score = p.totalTurns * 100 + memCount;
        const currentBest = primaryAgentId
          ? (results.find((r) => r.agentId === primaryAgentId)!.totalTurns * 100 +
             (memoriesPerAgent[primaryAgentId] || []).length)
          : -1;
        if (p.totalTurns > 0 && score > currentBest) {
          primaryAgentId = p.agentId;
          primaryTurns = p.totalTurns;
        }
      }
    }

    // --- Character-style image (single-agent mode only) ---
    let imageUrl: string | null = null;
    if (singleAgentId) {
      try {
        imageUrl = await generateAndUploadAgentImage(admin, singleAgentId);
      } catch (e) {
        console.error("[soul-mirror] image gen failed", e);
      }
    }

    const userSnapshot: any = {
      nickname,
      mbti,
      zodiac,
      locale,
      generatedAt: new Date().toISOString(),
      primaryAgentId,
      primaryTurns,
      edition,
      triggerTurn: singleAgentId
        ? (bondsMap[singleAgentId]?.total_turns ?? 0)
        : primaryTurns,
      sinceMirrorId: lastMirror?.id ?? null,
      highlights: highlights.slice(0, 4),
    };
    if (singleAgentId) {
      userSnapshot.singleAgentId = singleAgentId;
      userSnapshot.imageUrl = imageUrl;
    }

    const { data: inserted, error: insertErr } = await admin
      .from("soul_mirrors")
      .insert({
        user_id: userId,
        perspectives: results,
        user_snapshot: userSnapshot,
      })
      .select("id, created_at")
      .single();

    if (insertErr) {
      console.error("[soul-mirror] insert err", insertErr);
      return new Response(JSON.stringify({ error: "save_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        id: inserted.id,
        createdAt: inserted.created_at,
        perspectives: results,
        userSnapshot,
        primaryAgentId,
        imageUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[soul-mirror] error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// =============== Image generation helper ===============

async function generateAndUploadAgentImage(
  admin: ReturnType<typeof createClient>,
  agentId: string,
): Promise<string | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;
  const basePrompt = AGENT_IMAGE_PROMPT[agentId];
  if (!basePrompt) return null;
  const prompt = basePrompt + IMAGE_SUFFIX;

  const res = await fetch(AI_IMAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-image-2",
      prompt,
      quality: "low",
      size: "1024x1536",
      n: 1,
    }),
  });
  if (!res.ok) {
    console.error("[soul-mirror] image status", res.status, await res.text().catch(() => ""));
    return null;
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) return null;

  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const fileName = `soul-mirror-img_${agentId}_${crypto.randomUUID()}.png`;
  const { error } = await admin.storage
    .from("shared-posters")
    .upload(fileName, bytes, { contentType: "image/png", upsert: true });
  if (error) {
    console.error("[soul-mirror] upload err", error);
    return null;
  }
  const { data: pub } = admin.storage.from("shared-posters").getPublicUrl(fileName);
  return pub?.publicUrl || null;
}
