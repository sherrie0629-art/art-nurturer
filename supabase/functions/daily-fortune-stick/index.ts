import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LEVEL_BASE_ENERGY: Record<string, number> = {
  "上上签": 5,
  "上签": 4,
  "中签": 3,
  "下签": 2,
  "下下签": 1,
};

async function fetchAI(model: string, body: Record<string, unknown>) {
  return fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, model }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { stickNumber, level, title, poem, hint, focus } = body || {};

    if (!stickNumber || !level || !title || !poem) {
      return new Response(JSON.stringify({ error: "Missing stick info" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 同日已抽则返回原结果
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("fortune_stick_draws")
      .select("*")
      .eq("user_id", user.id)
      .eq("draw_date", today)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          id: existing.id,
          stickNumber: existing.stick_number,
          level: existing.stick_level,
          title: existing.stick_title,
          poem: existing.stick_poem,
          interpretation: existing.interpretation,
          actionTip: existing.action_tip,
          energyScore: existing.energy_score,
          reused: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const system = `你是一位融合心理学与中国传统文化的「现代解签人」。
用户求得一支灵签，你要做的是：
1. 用 3-4 句温暖、有洞察力的现代白话，解读这支签对用户「今日」的提点（不要照搬古文，不要宗教化说教）；
2. 联系签等（${level}）给出对事业 / 感情 / 健康三个面向各一句简短建议（每条不超过 25 字）；
3. 全文使用简体中文，整体语气像一位见过世面、懂心理的老朋友，温柔而不肉麻。
4. 严禁出现"佛祖""菩萨""神明""上苍"等宗教词；可用"宇宙""命运""时机""能量"等中性词。

输出必须调用 fortune_interpret 工具。`;

    const userContent = `今日签号：第 ${stickNumber} 签
签等：${level}
签题：${title}
签诗：
${poem}

签的传统提点：${hint || "（无）"}

用户今日关注的焦点：${focus || "（用户没有特别说明，请给通用的今日提点）"}

请给出现代化的解签，并填入 fortune_interpret 工具。`;

    const aiResp = await fetchAI("google/gemini-2.5-flash", {
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "fortune_interpret",
            description: "返回现代化解签内容",
            parameters: {
              type: "object",
              properties: {
                interpretation: {
                  type: "string",
                  description:
                    "120-180 字的整体解签正文（白话），包含今日提点 + 事业/感情/健康三句建议（用 \\n 分隔成三段，前面带「事业：」「感情：」「健康：」前缀）",
                },
                actionTip: {
                  type: "string",
                  description: "一句 15 字以内的今日可执行小动作，可带 1 个 emoji",
                },
                energyAdjust: {
                  type: "integer",
                  description: "在签等基础能量分上的微调，-1/0/+1，整数",
                },
              },
              required: ["interpretation", "actionTip"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "fortune_interpret" } },
      temperature: 0.85,
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试。" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 额度已用完，请稍后再试。" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI service error");
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let interpretation = "心静则万事自然，今日把节奏放慢一些。";
    let actionTip = "给自己泡一杯热茶 🍵";
    let energyAdjust = 0;
    if (toolCall) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        if (args.interpretation) interpretation = String(args.interpretation);
        if (args.actionTip) actionTip = String(args.actionTip);
        if (typeof args.energyAdjust === "number") {
          energyAdjust = Math.max(-1, Math.min(1, Math.round(args.energyAdjust)));
        }
      } catch (e) {
        console.warn("parse args failed", e);
      }
    }

    const baseEnergy = LEVEL_BASE_ENERGY[level] ?? 3;
    const energyScore = Math.max(1, Math.min(5, baseEnergy + energyAdjust));

    const { data: row, error: insertErr } = await supabase
      .from("fortune_stick_draws")
      .insert({
        user_id: user.id,
        draw_date: today,
        stick_number: stickNumber,
        stick_level: level,
        stick_title: title,
        stick_poem: poem,
        interpretation,
        action_tip: actionTip,
        energy_score: energyScore,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("insert err", insertErr);
      return new Response(JSON.stringify({ error: "保存抽签结果失败" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        id: row.id,
        stickNumber,
        level,
        title,
        poem,
        interpretation,
        actionTip,
        energyScore,
        reused: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("daily-fortune-stick error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});