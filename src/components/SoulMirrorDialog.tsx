import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Download, Share2, Crown, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSoulMirror, type SoulMirror, type SoulMirrorPerspective } from "@/hooks/useSoulMirror";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  userId: string | undefined;
  onClose: () => void;
  /** Existing mirror to show instead of triggering generation. */
  existingMirror?: SoulMirror | null;
  /** When set, only generate the mirror from this single agent (chat-page mode). */
  singleAgentId?: string;
}

type Phase = "intro" | "generating" | "result" | "pro_required" | "throttled" | "error";

const POSTER_W = 1080;
const POSTER_H = 1350;

const AGENT_BG: Record<string, [string, string]> = {
  nuannuan: ["#5a3a2a", "#d49a6a"],
  laowang:  ["#2a3a2e", "#6a8a5a"],
  yunsheng: ["#1e2a4a", "#5a7ab8"],
  xinggui:  ["#3a2a5a", "#b07ad9"],
};

const AGENT_NAME: Record<string, { zh: string; en: string }> = {
  nuannuan: { zh: "暖暖", en: "Nuannuan" },
  laowang:  { zh: "老王", en: "Laowang" },
  yunsheng: { zh: "云生", en: "Yunsheng" },
  xinggui:  { zh: "星轨", en: "Xinggui" },
};

export default function SoulMirrorDialog({ open, userId, onClose, existingMirror, singleAgentId }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { generate, attachPosterUrl } = useSoulMirror(userId);
  const isSingle = !!singleAgentId;
  const [phase, setPhase] = useState<Phase>(existingMirror ? "result" : "intro");
  const [mirror, setMirror] = useState<SoulMirror | null>(existingMirror || null);
  const [posterUrl, setPosterUrl] = useState<string | null>(existingMirror?.poster_url || null);
  const [hoursLeft, setHoursLeft] = useState<number | undefined>(undefined);
  const [bondTurns, setBondTurns] = useState<Record<string, number>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!open) return;
    if (existingMirror) {
      setMirror(existingMirror);
      setPosterUrl(existingMirror.poster_url);
      setPhase("result");
    } else {
      setPhase("intro");
      setMirror(null);
      setPosterUrl(null);
    }
  }, [open, existingMirror]);

  // Fetch chat progress for entry hint
  useEffect(() => {
    if (!open || !userId || phase !== "intro") return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("agent_bonds")
        .select("agent_id, total_turns")
        .eq("user_id", userId)
        .in("agent_id", ["nuannuan", "laowang", "yunsheng", "xinggui"]);
      if (cancelled) return;
      const map: Record<string, number> = {};
      for (const r of (data as any[] || [])) map[r.agent_id] = r.total_turns || 0;
      setBondTurns(map);
    })();
    return () => { cancelled = true; };
  }, [open, userId, phase]);

  const handleGenerate = useCallback(async () => {
    setPhase("generating");
    const res: any = await generate(singleAgentId);
    if (!res.ok) {
      if (res.reason === "requires_pro") {
        setPhase("pro_required");
      } else if (res.reason === "throttled") {
        setHoursLeft(res.hoursLeft);
        setPhase("throttled");
      } else {
        setPhase("error");
      }
      return;
    }
    setMirror(res.mirror);
    setPhase("result");
  }, [generate, singleAgentId]);

  // Render poster onto canvas once mirror appears
  useEffect(() => {
    if (phase !== "result" || !mirror) return;
    let cancelled = false;
    (async () => {
      const dataUrl = await renderPoster(mirror);
      if (cancelled) return;
      setPosterUrl(dataUrl);
      // Upload to storage in background
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const fileName = `soul-mirror_${mirror.id}.png`;
        const { error } = await supabase.storage
          .from("shared-posters")
          .upload(fileName, blob, { contentType: "image/png", upsert: true });
        if (!error) {
          const { data } = supabase.storage.from("shared-posters").getPublicUrl(fileName);
          if (data?.publicUrl) await attachPosterUrl(mirror.id, data.publicUrl);
        }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [phase, mirror, attachPosterUrl]);

  const handleShare = useCallback(async () => {
    if (!posterUrl) return;
    try {
      const blob = await (await fetch(posterUrl)).blob();
      const file = new File([blob], "soul-mirror.png", { type: "image/png" });
      if (navigator.share && (navigator as any).canShare?.({ files: [file] })) {
        await navigator.share({
          title: t("soulMirror.shareTitle"),
          text: t("soulMirror.shareText"),
          files: [file],
        });
        return;
      }
      // fallback: download
      handleDownload();
    } catch (e: any) {
      if (e?.name !== "AbortError") toast.error(t("common.somethingWrong"));
    }
  }, [posterUrl, t]);

  const handleDownload = useCallback(() => {
    if (!posterUrl) return;
    const a = document.createElement("a");
    a.href = posterUrl;
    a.download = "soul-mirror.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(t("soulMirror.savedToast"));
  }, [posterUrl, t]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto"
        onClick={(e) => { if (e.target === e.currentTarget && phase !== "generating") onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 shadow-2xl my-8"
        >
          {phase !== "generating" && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20"
              aria-label="close"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {phase === "intro" && (
            <div className="p-8 text-center text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-glow">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              {(() => {
                if (isSingle) {
                  const id = singleAgentId!;
                  const name = AGENT_NAME[id]?.[i18n.language === "en" ? "en" : "zh"] || id;
                  const emoji = ({ nuannuan: "🧵", laowang: "🍵", yunsheng: "🌙", xinggui: "✨" } as Record<string, string>)[id] || "✨";
                  const desc = t(`soulMirror.lens.${id}`);
                  const title = i18n.language === "en"
                    ? `A mirror written just by ${name}`
                    : `${name} 为你写一张镜像`;
                  const sub = i18n.language === "en"
                    ? `${name} will draw what they see in you — a poster with a portrait scene in their own world.`
                    : `${name} 会把你写成一张诗意的小镜像，附上一幅属于 ${name} 世界的场景图。`;
                  return (
                    <>
                      <h2 className="font-display text-2xl font-bold mb-2">{title}</h2>
                      <p className="text-sm text-white/80 mb-6 leading-relaxed">{sub}</p>
                      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-6 text-left flex items-start gap-3">
                        <div className="text-3xl leading-none">{emoji}</div>
                        <div>
                          <div className="text-sm font-semibold">{name}</div>
                          <div className="text-xs text-white/60 leading-snug mt-1">{desc}</div>
                        </div>
                      </div>
                    </>
                  );
                }
                return (
                  <>
                    <h2 className="font-display text-2xl font-bold mb-2">{t("soulMirror.unlockedTitle")}</h2>
                    <p className="text-sm text-white/80 mb-6 leading-relaxed whitespace-pre-line">{t("soulMirror.unlockedDesc")}</p>
                    <div className="grid grid-cols-2 gap-2 mb-6 text-left">
                      {[
                        { e: "🧵", id: "nuannuan", d: t("soulMirror.lens.nuannuan") },
                        { e: "🍵", id: "laowang",  d: t("soulMirror.lens.laowang") },
                        { e: "🌙", id: "yunsheng", d: t("soulMirror.lens.yunsheng") },
                        { e: "✨", id: "xinggui",  d: t("soulMirror.lens.xinggui") },
                      ].map((a) => (
                        <div key={a.id} className="rounded-xl bg-white/5 border border-white/10 p-2.5">
                          <div className="text-lg">{a.e}</div>
                          <div className="text-xs font-semibold">{AGENT_NAME[a.id][i18n.language === "en" ? "en" : "zh"]}</div>
                          <div className="text-[10px] text-white/60 leading-snug">{a.d}</div>
                        </div>
                      ))}
                    </div>
                    {(() => {
                      const chatted = Object.entries(bondTurns).filter(([, n]) => (n || 0) >= 3);
                      if (chatted.length === 0 && Object.keys(bondTurns).length > 0) {
                        return <p className="text-[11px] text-white/50 mb-3 leading-snug">{t("soulMirror.entryHint.allUnmet")}</p>;
                      }
                      if (chatted.length === 1) {
                        const id = chatted[0][0];
                        const name = AGENT_NAME[id]?.[i18n.language === "en" ? "en" : "zh"] || id;
                        return <p className="text-[11px] text-white/50 mb-3 leading-snug">{t("soulMirror.entryHint.onlyOne", { name })}</p>;
                      }
                      return null;
                    })()}
                  </>
                );
              })()}
              <button
                onClick={handleGenerate}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 py-3 font-semibold text-white shadow-lg active:scale-[0.98] transition"
              >
                {t("soulMirror.cta")}
              </button>
              <button onClick={onClose} className="mt-3 text-xs text-white/60 hover:text-white/80">{t("soulMirror.later")}</button>
            </div>
          )}

          {phase === "generating" && (
            <div className="p-10 text-center text-white">
              <Loader2 className="h-10 w-10 animate-spin text-pink-400 mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">
                {isSingle
                  ? t("soulMirror.generatingTitleSingle", {
                      name: AGENT_NAME[singleAgentId!]?.[i18n.language === "en" ? "en" : "zh"] || singleAgentId,
                    })
                  : t("soulMirror.generatingTitle")}
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                {isSingle
                  ? t("soulMirror.generatingDescSingle", {
                      name: AGENT_NAME[singleAgentId!]?.[i18n.language === "en" ? "en" : "zh"] || singleAgentId,
                    })
                  : t("soulMirror.generatingDesc")}
              </p>
            </div>
          )}

          {phase === "result" && (
            <div className="p-5">
              {mirror?.user_snapshot?.highlights && mirror.user_snapshot.highlights.length > 0 && (
                <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] font-semibold text-pink-300/90 mb-2">
                    ✨ {t("soulMirror.newHighlights")}
                    {mirror.user_snapshot.edition && mirror.user_snapshot.edition > 1
                      ? ` · ${t("soulMirror.editionLabel", { n: mirror.user_snapshot.edition })}`
                      : null}
                  </p>
                  <ul className="space-y-1">
                    {mirror.user_snapshot.highlights.slice(0, 4).map((h, i) => (
                      <li key={i} className="text-[11px] text-white/70 leading-snug">
                        · {h.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {posterUrl ? (
                <img src={posterUrl} alt="灵魂镜像" className="w-full rounded-2xl shadow-2xl" />
              ) : (
                <div className="aspect-[4/5] rounded-2xl bg-white/5 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleShare}
                  disabled={!posterUrl}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Share2 className="h-4 w-4" /> {t("soulMirror.share")}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!posterUrl}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMirror(null);
                  setPosterUrl(null);
                  setPhase("intro");
                }}
                className="mt-3 w-full rounded-2xl border border-white/15 py-2.5 text-xs font-medium text-white/75 hover:bg-white/5"
              >
                {t("soulMirror.vaultRegenerate")}
              </button>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {phase === "pro_required" && (
            <div className="p-8 text-center text-white">
              <Crown className="h-10 w-10 text-amber-400 mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">{t("soulMirror.proTitle")}</h2>
              <p className="text-sm text-white/70 mb-6">{t("soulMirror.proDesc")}</p>
              <button
                onClick={onClose}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 py-3 font-semibold text-white"
              >
                {t("soulMirror.upgradeCta")}
              </button>
              <button onClick={onClose} className="mt-3 text-xs text-white/60">{t("common.close")}</button>
            </div>
          )}

          {phase === "throttled" && (
            <div className="p-8 text-center text-white">
              <h2 className="font-display text-xl font-bold mb-2">{t("soulMirror.throttledTitle")}</h2>
              <p className="text-sm text-white/70 mb-6">{t("soulMirror.throttledDesc", { hours: hoursLeft ?? 1 })}</p>
              <button onClick={onClose} className="w-full rounded-2xl bg-white/10 py-3 text-sm font-semibold">{t("common.close")}</button>
            </div>
          )}

          {phase === "error" && (
            <div className="p-8 text-center text-white">
              <h2 className="font-display text-xl font-bold mb-2">{t("common.somethingWrong")}</h2>
              <button onClick={handleGenerate} className="mt-3 w-full rounded-2xl bg-white/10 py-3 text-sm font-semibold">{t("common.retry")}</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// =============== Canvas rendering ===============

async function renderPoster(mirror: SoulMirror): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, POSTER_W, POSTER_H);
  bg.addColorStop(0, "#1a1230");
  bg.addColorStop(0.5, "#2a1648");
  bg.addColorStop(1, "#0f0a1f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  // Subtle stars
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(Math.random() * POSTER_W, Math.random() * POSTER_H, Math.random() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Header
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "700 60px 'DM Serif Display', serif";
  ctx.fillText("灵魂镜像", POSTER_W / 2, 100);

  const snap = mirror.user_snapshot;
  const locale: "zh" | "en" = (snap?.locale === "en" ? "en" : "zh");
  const primaryAgentId: string | null = (snap as any)?.primaryAgentId ?? null;
  const primaryTurns: number = (snap as any)?.primaryTurns ?? 0;
  const singleAgentId: string | null = (snap as any)?.singleAgentId ?? null;
  const imageUrl: string | null = (snap as any)?.imageUrl ?? null;

  if (snap) {
    ctx.font = "30px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    const sub = [`@${snap.nickname}`, snap.mbti, snap.zodiac].filter(Boolean).join(" · ");
    ctx.fillText(sub, POSTER_W / 2, 142);
  }

  // Dynamic subtitle line
  const primary = primaryAgentId ? mirror.perspectives.find((p) => p.agentId === primaryAgentId) : null;
  const subtitleLine = singleAgentId && primary
    ? `${primary.displayName} 写给你的灵魂镜像`
    : primary
    ? `与 ${primary.displayName} 深聊 ${primaryTurns} 次后的灵魂镜像`
    : "四位 AI 对你的第一印象";
  ctx.font = "italic 26px 'DM Serif Display', serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(subtitleLine, POSTER_W / 2, 178);

  // ===== Single-agent layout =====
  if (singleAgentId && primary) {
    let img: HTMLImageElement | null = null;
    if (imageUrl) {
      try {
        img = await loadImage(imageUrl);
      } catch { img = null; }
    }
    await drawSingleAgentCard(ctx, primary, img, locale);
    // Footer
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "italic 28px 'DM Serif Display', serif";
    ctx.textAlign = "center";
    ctx.fillText("心灵密语 · 心灵镜像 · islandai.life", POSTER_W / 2, POSTER_H - 60);
    return canvas.toDataURL("image/png");
  }

  // Layout area
  const gridTop = 210;
  const gridBottom = POSTER_H - 130;
  const gridLeft = 50;
  const gridRight = POSTER_W - 50;
  const gridW = gridRight - gridLeft;
  const gridH = gridBottom - gridTop;
  const gap = 18;

  if (primary) {
    // Primary layout: big top card (~58%) + 3 small cards bottom
    const topH = Math.floor(gridH * 0.58) - gap / 2;
    const bottomH = gridH - topH - gap;
    drawQuadrant(ctx, gridLeft, gridTop, gridW, topH, primary, { primary: true, locale });
    const others = mirror.perspectives.filter((p) => p.agentId !== primary.agentId);
    const cellW = (gridW - gap * 2) / 3;
    others.slice(0, 3).forEach((p, i) => {
      const x = gridLeft + i * (cellW + gap);
      const y = gridTop + topH + gap;
      drawQuadrant(ctx, x, y, cellW, bottomH, p, { primary: false, locale, compact: true });
    });
  } else {
    // Symmetric 2x2
    const cellW = gridW / 2;
    const cellH = gridH / 2;
    for (let i = 0; i < 4 && i < mirror.perspectives.length; i++) {
      const p = mirror.perspectives[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = gridLeft + col * cellW + (col === 0 ? 0 : gap / 2);
      const y = gridTop + row * cellH + (row === 0 ? 0 : gap / 2);
      const w = cellW - gap / 2;
      const h = cellH - gap / 2;
      drawQuadrant(ctx, x, y, w, h, p, { primary: false, locale });
    }
  }

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "italic 28px 'DM Serif Display', serif";
  ctx.textAlign = "center";
    ctx.fillText("心灵密语 · 心灵镜像 · islandai.life", POSTER_W / 2, POSTER_H - 60);

  return canvas.toDataURL("image/png");
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

async function drawSingleAgentCard(
  ctx: CanvasRenderingContext2D,
  p: SoulMirrorPerspective,
  img: HTMLImageElement | null,
  locale: "zh" | "en",
) {
  const cardX = 60;
  const cardY = 210;
  const cardW = POSTER_W - 120;
  const cardH = POSTER_H - 210 - 130;

  // Card background
  const colors = AGENT_BG[p.agentId] || ["#3a2a5a", "#7a5ab8"];
  const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  grad.addColorStop(0, hexToRgba(colors[0], 0.92));
  grad.addColorStop(1, hexToRgba(colors[1], 0.78));
  roundRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.stroke();

  // Image area (top ~46%)
  const imgPad = 40;
  const imgX = cardX + imgPad;
  const imgY = cardY + imgPad;
  const imgW = cardW - imgPad * 2;
  const imgH = Math.floor(cardH * 0.46);

  // Image clip
  ctx.save();
  roundRect(ctx, imgX, imgY, imgW, imgH, 24);
  ctx.clip();
  if (img) {
    // cover
    const ir = img.width / img.height;
    const fr = imgW / imgH;
    let dw = imgW, dh = imgH, dx = imgX, dy = imgY;
    if (ir > fr) {
      dh = imgH; dw = imgH * ir; dx = imgX - (dw - imgW) / 2; dy = imgY;
    } else {
      dw = imgW; dh = imgW / ir; dx = imgX; dy = imgY - (dh - imgH) / 2;
    }
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    // Fallback gradient with emoji
    const g2 = ctx.createLinearGradient(imgX, imgY, imgX + imgW, imgY + imgH);
    g2.addColorStop(0, hexToRgba(colors[0], 1));
    g2.addColorStop(1, hexToRgba(colors[1], 1));
    ctx.fillStyle = g2;
    ctx.fillRect(imgX, imgY, imgW, imgH);
    ctx.font = "180px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(p.emoji, imgX + imgW / 2, imgY + imgH / 2);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  // Name row beneath image
  let cy = imgY + imgH + 56;
  ctx.textAlign = "left";
  ctx.font = "56px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(p.emoji, cardX + imgPad, cy);
  ctx.font = "700 48px 'DM Serif Display', serif";
  ctx.fillText(p.displayName, cardX + imgPad + 70, cy - 6);

  // Signature
  cy += 56;
  ctx.font = "italic 34px 'DM Serif Display', serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  const sigLines = wrapText(ctx, p.signature, cardW - imgPad * 2);
  for (const line of sigLines.slice(0, 2)) {
    ctx.fillText(line, cardX + imgPad, cy);
    cy += 42;
  }

  // Divider
  cy += 14;
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + imgPad, cy);
  ctx.lineTo(cardX + cardW - imgPad, cy);
  ctx.stroke();
  cy += 32;

  // Body
  ctx.font = "30px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  const lineH = 42;
  const reserveBottom = 90; // for chips
  const maxBodyH = (cardY + cardH - imgPad) - cy - reserveBottom;
  const maxLines = Math.max(2, Math.floor(maxBodyH / lineH));
  const bodyLines = wrapText(ctx, p.portrait, cardW - imgPad * 2);
  const shown = bodyLines.slice(0, maxLines);
  if (bodyLines.length > maxLines && shown.length > 0) {
    shown[shown.length - 1] = truncateToWidth(ctx, shown[shown.length - 1] + "…", cardW - imgPad * 2);
  }
  for (const line of shown) {
    ctx.fillText(line, cardX + imgPad, cy);
    cy += lineH;
  }

  // Keyword chips centered
  const kwY = cardY + cardH - imgPad - 6;
  ctx.font = "26px 'Inter', sans-serif";
  const kws = p.keywords.slice(0, 3).map((k) => `#${k}`);
  const widths = kws.map((k) => ctx.measureText(k).width + 28);
  const chipGap = 14;
  const totalW = widths.reduce((a, b) => a + b, 0) + chipGap * (kws.length - 1);
  let kx = cardX + (cardW - totalW) / 2;
  for (let i = 0; i < kws.length; i++) {
    const w = widths[i];
    roundRect(ctx, kx, kwY - 28, w, 36, 18);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(kws[i], kx + 14, kwY);
    kx += w + chipGap;
  }
  void locale;
}

function drawQuadrant(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  p: SoulMirrorPerspective,
  opts: { primary?: boolean; locale: "zh" | "en"; compact?: boolean } = { locale: "zh" },
) {
  const tier = (p as any).tier as ("unmet" | "glimpse" | "known" | undefined);
  const isPrimary = !!opts.primary;
  const compact = !!opts.compact;
  const cardAlpha = tier === "unmet" ? 0.55 : 0.85;

  const colors = AGENT_BG[p.agentId] || ["#3a2a5a", "#7a5ab8"];
  // Card background gradient
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, hexToRgba(colors[0], cardAlpha));
  grad.addColorStop(1, hexToRgba(colors[1], cardAlpha - 0.15));
  roundRect(ctx, x, y, w, h, 24);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = isPrimary ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.15)";
  ctx.lineWidth = isPrimary ? 3 : 1.5;
  roundRect(ctx, x, y, w, h, 24);
  ctx.stroke();

  const padding = compact ? 18 : 28;
  const titleFontSize = isPrimary ? 44 : compact ? 26 : 32;
  const emojiFontSize = isPrimary ? 64 : compact ? 38 : 50;
  const sigFontSize = isPrimary ? 32 : compact ? 20 : 26;
  const bodyFontSize = isPrimary ? 30 : compact ? 18 : 24;
  const bodyLineHeight = isPrimary ? 40 : compact ? 26 : 34;
  let cy = y + padding + (isPrimary ? 50 : compact ? 30 : 36);

  // Header: emoji + name
  ctx.textAlign = "left";
  ctx.font = `${emojiFontSize}px sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(p.emoji, x + padding, cy);
  ctx.font = `700 ${titleFontSize}px 'DM Serif Display', serif`;
  ctx.fillText(p.displayName, x + padding + emojiFontSize + 12, cy - 6);
  cy += isPrimary ? 44 : compact ? 22 : 32;

  // Tier badge (top-right)
  if (tier === "unmet" || tier === "glimpse") {
    const badgeText = tier === "unmet" ? "远观初见" : "浅浅聊过";
    ctx.font = `${compact ? 15 : 18}px 'Inter', sans-serif`;
    const bw = ctx.measureText(badgeText).width + 20;
    const bh = compact ? 22 : 26;
    const bx = x + w - padding - bw;
    const by = y + padding;
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(badgeText, bx + 10, by + bh - (compact ? 6 : 7));
  } else if (isPrimary) {
    const badgeText = `最懂你的那一位 · ${(p as any).totalTurns ?? 0} 轮`;
    ctx.font = "18px 'Inter', sans-serif";
    const bw = ctx.measureText(badgeText).width + 22;
    const bh = 28;
    const bx = x + w - padding - bw;
    const by = y + padding;
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(badgeText, bx + 11, by + bh - 8);
  }

  // Signature
  ctx.font = `italic ${sigFontSize}px 'DM Serif Display', serif`;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  const sigLines = wrapText(ctx, p.signature, w - padding * 2);
  const sigMax = compact ? 1 : 2;
  for (const line of sigLines.slice(0, sigMax)) {
    ctx.fillText(line, x + padding, cy);
    cy += sigFontSize + 6;
  }
  cy += compact ? 4 : 6;

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + padding, cy);
  ctx.lineTo(x + w - padding, cy);
  ctx.stroke();
  cy += compact ? 14 : 22;

  // Portrait body
  ctx.font = `${bodyFontSize}px 'Inter', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  const reserveForKeywords = compact ? 36 : 80;
  const maxBodyHeight = h - (cy - y) - reserveForKeywords;
  const maxLines = Math.floor(maxBodyHeight / bodyLineHeight);
  const bodyLines = wrapText(ctx, p.portrait, w - padding * 2);
  const shown = bodyLines.slice(0, maxLines);
  if (bodyLines.length > maxLines && shown.length > 0) {
    const last = shown[shown.length - 1];
    shown[shown.length - 1] = truncateToWidth(ctx, last + "…", w - padding * 2);
  }
  for (const line of shown) {
    ctx.fillText(line, x + padding, cy);
    cy += bodyLineHeight;
  }

  // In compact (副格) skip keyword chips — too crowded
  if (compact) return;

  // Keywords at bottom
  const kwY = y + h - padding - 18;
  let kwX = x + padding;
  ctx.font = "22px 'Inter', sans-serif";
  for (const kw of p.keywords.slice(0, 3)) {
    const text = `#${kw}`;
    const wText = ctx.measureText(text).width;
    if (kwX + wText + 24 > x + w - padding) break;
    roundRect(ctx, kwX - 8, kwY - 20, wText + 18, 28, 14);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, kwX + 1, kwY);
    kwX += wText + 28;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  // Mixed CN/EN: try whitespace split first; if a "word" is wider than maxWidth, fall back to per-char.
  const lines: string[] = [];
  const paras = text.split(/\n+/);
  for (const para of paras) {
    if (!para) continue;
    let line = "";
    const tokens = para.split(/(\s+)/);
    for (const tok of tokens) {
      if (ctx.measureText(line + tok).width <= maxWidth) {
        line += tok;
      } else {
        if (ctx.measureText(tok).width > maxWidth) {
          // per-char wrap
          if (line) { lines.push(line); line = ""; }
          for (const ch of tok) {
            if (ctx.measureText(line + ch).width > maxWidth && line) {
              lines.push(line);
              line = ch;
            } else {
              line += ch;
            }
          }
        } else {
          lines.push(line.trimEnd());
          line = tok.trimStart();
        }
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  let t = text;
  while (t.length > 1 && ctx.measureText(t).width > maxWidth) t = t.slice(0, -2) + "…";
  return t;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
