import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import i18n from "@/i18n";
import { CHAT_FRAGMENT_TURN_INTERVAL } from "@/lib/soulFragmentRules";

export async function generateSoulFragment(
  userId: string,
  sourceType: "assessment" | "chat",
  sourceId: string,
  context: string,
  options?: { totalTurns?: number },
) {
  try {
    const concreteType = sourceType === "chat" ? "chat" : sourceId;

    if (sourceType === "chat") {
      const totalTurns = options?.totalTurns ?? 0;
      if (totalTurns < CHAT_FRAGMENT_TURN_INTERVAL) return;

      const allowed = Math.floor(totalTurns / CHAT_FRAGMENT_TURN_INTERVAL);
      const { count } = await (supabase as any)
        .from("soul_fragments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("source_type", "chat")
        .eq("source_agent", sourceId);

      if ((count ?? 0) >= allowed) return;
    } else {
      const { data: existing } = await (supabase as any)
        .from("soul_fragments")
        .select("id")
        .eq("user_id", userId)
        .eq("source_type", concreteType)
        .maybeSingle();

      if (existing?.id) {
        await (supabase as any).from("soul_fragments").delete().eq("id", existing.id);
      }
    }

    const locale = (i18n.resolvedLanguage || i18n.language || "en").startsWith("zh") ? "zh" : "en";
    const { data, error } = await supabase.functions.invoke("generate-soul-fragment", {
      body: { type: sourceType, context, sourceId, locale },
    });
    if (error || !data?.name) {
      if (error) console.error("generate-soul-fragment error:", error);
      return;
    }

    const { error: insertError } = await (supabase as any).from("soul_fragments").insert({
      user_id: userId,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      source_type: concreteType,
      source_agent: sourceType === "chat" ? sourceId : null,
    });
    if (insertError) {
      console.error("soul_fragments insert error:", insertError);
      return;
    }

    toast.success(i18n.t("soulFragment.newToast", { name: data.name, defaultValue: `✨ New Soul Fragment: ${data.name}` }));
  } catch (e) {
    console.error("Soul fragment generation failed:", e);
  }
}
