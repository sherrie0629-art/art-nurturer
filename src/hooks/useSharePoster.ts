import { useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { probeMbtiPosterCached } from "@/lib/mbtiPosterCache";
import { normalizeAssessmentProfile, type AssessmentProfile } from "@/lib/assessmentProfile";

const POSTER_WIDTH = 750;
const POSTER_PADDING = 75;
const CONTENT_WIDTH = POSTER_WIDTH - POSTER_PADDING * 2;

interface PosterConfig {
  title: string;
  subtitle: string;
  description: string;
  bars: { label1: string; label2: string; value: number }[];
  accentColor: string;
  accentColorLight: string;
  icon: string;
  caption: string;
  extraLines?: string[];
  appName?: string;
  imagePrompt?: string;
  imageCacheKey?: string;
  preloadedImageUrl?: string;
  barsSectionTitle?: string;
  brandCta?: string;
  profileHook?: string;
  profileBullets?: string[];
}

const imageCache = new Map<string, string>();

export function useSharePoster() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null);
  const [showPosterPreview, setShowPosterPreview] = useState(false);

  const fetchAIImage = useCallback(async (
    prompt: string,
    options?: { cacheKey?: string; returnUrlOnly?: boolean },
  ): Promise<(HTMLImageElement & { src: string }) | { src: string } | null> => {
    try {
      const cacheLookupKey = options?.cacheKey || prompt;
      const cached = imageCache.get(cacheLookupKey);
      if (cached) {
        if (options?.returnUrlOnly) return { src: cached };
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img as HTMLImageElement & { src: string });
          img.onerror = () => resolve(null);
          img.src = cached;
        });
      }

      if (options?.cacheKey?.startsWith("mbti-")) {
        const mbtiType = options.cacheKey.slice("mbti-".length);
        const storageUrl = await probeMbtiPosterCached(mbtiType);
        if (storageUrl) {
          imageCache.set(cacheLookupKey, storageUrl);
          if (options?.returnUrlOnly) return { src: storageUrl };
          return loadImageViaBlobUrl(storageUrl);
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-poster-image", {
        body: { prompt, cacheKey: options?.cacheKey },
      });
      if (error || !data?.imageUrl) return null;

      imageCache.set(cacheLookupKey, data.imageUrl);

      if (options?.returnUrlOnly) return { src: data.imageUrl };
      return loadImageViaBlobUrl(data.imageUrl);
    } catch {
      return null;
    }
  }, []);

  const generatePoster = useCallback(async (config: PosterConfig) => {
    await ensurePosterFonts();

    const aiImagePromise = config.preloadedImageUrl
      ? loadImageViaBlobUrl(config.preloadedImageUrl)
      : config.imagePrompt ? fetchAIImage(config.imagePrompt, { cacheKey: config.imageCacheKey }) : Promise.resolve(null);

    const measureCanvas = document.createElement("canvas");
    measureCanvas.width = POSTER_WIDTH;
    measureCanvas.height = 100;
    const mCtx = measureCanvas.getContext("2d")!;

    mCtx.font = "24px sans-serif";
    const descMaxWidth = CONTENT_WIDTH - 60;
    const profile = normalizeAssessmentProfile({
      description: config.description,
      profileHook: config.profileHook,
      profileBullets: config.profileBullets,
    });
    const descCardHeight = measureProfileCardHeight(mCtx, profile, descMaxWidth, config.accentColor);

    const barItemHeight = 70;
    const barSectionHeight = 40 + config.bars.length * barItemHeight;

    let extraSectionHeight = 0;
    if (config.extraLines && config.extraLines.length > 0) {
      extraSectionHeight = 30 + config.extraLines.length * 40 + 30;
    }

    const imageSize = 260;
    const imageSectionHeight = config.imagePrompt || config.preloadedImageUrl ? imageSize + 40 : 0;

    const headerHeight = 330;
    const footerHeight = 160;
    const sectionGap = 30;

    const totalHeight = headerHeight
      + imageSectionHeight
      + descCardHeight + sectionGap
      + barSectionHeight + sectionGap
      + extraSectionHeight + (extraSectionHeight > 0 ? sectionGap : 0)
      + footerHeight;

    const POSTER_HEIGHT = Math.max(totalHeight, 1100);

    const canvas = document.createElement("canvas");
    canvas.width = POSTER_WIDTH;
    canvas.height = POSTER_HEIGHT;
    const ctx = canvas.getContext("2d")!;
    canvasRef.current = canvas;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, POSTER_HEIGHT);
    bgGrad.addColorStop(0, "#1a1625");
    bgGrad.addColorStop(0.5, "#1e1a2e");
    bgGrad.addColorStop(1, "#12101c");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

    ctx.globalAlpha = 0.06;
    ctx.fillStyle = config.accentColor;
    ctx.beginPath(); ctx.arc(620, 180, 280, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(130, POSTER_HEIGHT * 0.65, 200, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    drawGradientLine(ctx, config.accentColor, POSTER_PADDING, 675, 75);

    let y = 100;

    // Icon
    ctx.font = "64px serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(config.icon, POSTER_WIDTH / 2, y + 60);
    y += 90;

    // Title — wrap instead of hard truncate
    y = drawCenteredTitle(ctx, config.title, POSTER_WIDTH / 2, y + 20, CONTENT_WIDTH);
    y += 20;

    // Subtitle
    ctx.fillStyle = config.accentColor;
    ctx.font = "26px 'Inter', sans-serif";
    ctx.fillText(config.subtitle, POSTER_WIDTH / 2, y + 30);
    y += 50;

    // Divider
    ctx.strokeStyle = config.accentColor;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(220, y); ctx.lineTo(530, y); ctx.stroke();
    ctx.globalAlpha = 1;
    y += 20;

    // AI Image
    const aiImage = await aiImagePromise;
    if (aiImage) {
      const imgX = (POSTER_WIDTH - imageSize) / 2;
      const imgY = y;
      ctx.save();
      roundRect(ctx, imgX, imgY, imageSize, imageSize, 20);
      ctx.clip();
      ctx.drawImage(aiImage, imgX, imgY, imageSize, imageSize);
      ctx.restore();
      ctx.strokeStyle = config.accentColor;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 2;
      roundRect(ctx, imgX, imgY, imageSize, imageSize, 20);
      ctx.stroke();
      ctx.globalAlpha = 1;
      y += imageSize + 30;
    }

    // Description Card
    const cardX = 60;
    const cardWidth = POSTER_WIDTH - 120;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    roundRect(ctx, cardX, y, cardWidth, descCardHeight, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    roundRect(ctx, cardX, y, cardWidth, descCardHeight, 18);
    ctx.stroke();

    drawProfileInCard(ctx, profile, cardX, y, cardWidth, descMaxWidth, config.accentColor);
    y += descCardHeight + sectionGap;

    // Bars Section
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px 'DM Serif Display', serif";
    ctx.textAlign = "left";
    ctx.fillText(config.barsSectionTitle || "维度分析", POSTER_PADDING, y + 20);
    y += 40;

    for (const bar of config.bars) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "20px 'Inter', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(bar.label1, POSTER_PADDING, y + 16);
      if (bar.label2) {
        ctx.textAlign = "right";
        ctx.fillText(bar.label2, POSTER_WIDTH - POSTER_PADDING, y + 16);
      } else {
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "18px 'Inter', sans-serif";
        ctx.fillText(`${bar.value}%`, POSTER_WIDTH - POSTER_PADDING, y + 16);
      }
      y += 26;

      const barWidth = CONTENT_WIDTH;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      roundRect(ctx, POSTER_PADDING, y, barWidth, 14, 7);
      ctx.fill();

      const fillWidth = barWidth * (bar.value / 100);
      if (fillWidth > 0) {
        const barGrad = ctx.createLinearGradient(POSTER_PADDING, 0, POSTER_PADDING + fillWidth, 0);
        barGrad.addColorStop(0, config.accentColor);
        barGrad.addColorStop(1, config.accentColorLight);
        ctx.fillStyle = barGrad;
        roundRect(ctx, POSTER_PADDING, y, fillWidth, 14, 7);
        ctx.fill();
      }

      if (bar.label2) {
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "18px 'Inter', sans-serif";
        ctx.fillText(`${bar.value}%`, POSTER_WIDTH - POSTER_PADDING, y + 28);
      }
      y += 14 + 30;
    }

    // Extra Lines
    if (config.extraLines && config.extraLines.length > 0) {
      y += 10;
      const extraCardH = config.extraLines.length * 40 + 30;
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      roundRect(ctx, 60, y, cardWidth, extraCardH, 18);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "22px 'Inter', sans-serif";
      ctx.textAlign = "left";
      for (let i = 0; i < config.extraLines.length; i++) {
        const lineText = config.extraLines[i];
        const maxW = cardWidth - 60;
        let displayText = lineText;
        if (ctx.measureText(displayText).width > maxW) {
          while (ctx.measureText(displayText + "…").width > maxW && displayText.length > 0) {
            displayText = displayText.slice(0, -1);
          }
          displayText += "…";
        }
        ctx.fillText(displayText, 90, y + 35 + i * 40);
      }
      y += extraCardH + sectionGap;
    }

    // Caption
    const captionY = Math.max(y + 20, POSTER_HEIGHT - 130);
    ctx.fillStyle = config.accentColor;
    ctx.font = "italic 22px 'DM Serif Display', serif";
    ctx.textAlign = "center";
    const captionText = `"${config.caption}"`;
    let displayCaption = captionText;
    if (ctx.measureText(displayCaption).width > CONTENT_WIDTH) {
      const inner = config.caption.slice(0, 25) + "…";
      displayCaption = `"${inner}"`;
    }
    ctx.fillText(displayCaption, POSTER_WIDTH / 2, captionY);

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "18px 'Inter', sans-serif";
    ctx.fillText(config.appName || "心灵密语", POSTER_WIDTH / 2, captionY + 45);

    // Brand CTA
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "15px 'Inter', sans-serif";
    ctx.fillText(config.brandCta || "访问 islandai.life · 探索你的内心地图", POSTER_WIDTH / 2, captionY + 75);

    drawGradientLine(ctx, config.accentColor, POSTER_PADDING, 675, POSTER_HEIGHT - 40);

    return canvas;
  }, [fetchAIImage]);

  const sharePoster = useCallback(async (config: PosterConfig) => {
    try {
      toast.info("正在生成海报…", { duration: 3000 });
      const canvas = await generatePoster(config);

      const dataUrl = canvas.toDataURL("image/png");

      try {
        if (navigator.share && navigator.canShare) {
          const blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), "image/png")
          );
          const file = new File([blob], "assessment-result.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: config.title,
              text: config.caption,
              files: [file],
            });
            return;
          }
        }
      } catch (shareErr) {
        if ((shareErr as Error).name === "AbortError") return;
      }

      setPosterDataUrl(dataUrl);
      setShowPosterPreview(true);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast.error("保存失败，请重试");
      }
    }
  }, [generatePoster]);

  const closePosterPreview = useCallback(() => {
    setShowPosterPreview(false);
    setPosterDataUrl(null);
  }, []);

  const downloadPoster = useCallback(() => {
    if (!posterDataUrl) return;
    const a = document.createElement("a");
    a.href = posterDataUrl;
    a.download = "assessment-result.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("海报已保存 ✨");
  }, [posterDataUrl]);

  const uploadPosterToStorage = useCallback(async (dataUrl: string): Promise<string | null> => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `poster_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;
      const { error } = await supabase.storage
        .from("shared-posters")
        .upload(fileName, blob, { contentType: "image/png", upsert: false });
      if (error) return null;
      const { data: urlData } = supabase.storage.from("shared-posters").getPublicUrl(fileName);
      return urlData?.publicUrl || null;
    } catch {
      return null;
    }
  }, []);

  return {
    sharePoster,
    generatePoster,
    fetchAIImage,
    posterDataUrl,
    showPosterPreview,
    closePosterPreview,
    downloadPoster,
    uploadPosterToStorage,
  };
}

// Helpers

async function ensurePosterFonts() {
  try {
    await Promise.all([
      document.fonts.load('48px "DM Serif Display"'),
      document.fonts.load('26px Inter'),
      document.fonts.load('24px Inter'),
      document.fonts.load('20px Inter'),
    ]);
    await document.fonts.ready;
  } catch {
    /* fall back to system fonts */
  }
}

function drawCenteredTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
): number {
  let fontSize = 48;
  let lines: string[] = [];
  while (fontSize >= 34) {
    ctx.font = `bold ${fontSize}px 'DM Serif Display', serif`;
    lines = getWrappedLines(ctx, text, maxWidth);
    if (lines.length <= 2) break;
    fontSize -= 4;
  }
  if (lines.length > 2) {
    lines = lines.slice(0, 2);
    const last = lines[1];
    lines[1] = last.length > 1 ? `${last.slice(0, -1)}…` : `${last}…`;
  }
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  let y = startY + fontSize;
  for (const line of lines) {
    ctx.fillText(line, centerX, y);
    y += fontSize * 1.12;
  }
  return y;
}

function measureProfileCardHeight(
  ctx: CanvasRenderingContext2D,
  profile: AssessmentProfile,
  maxWidth: number,
  _accentColor: string,
): number {
  const padding = 50;
  let height = padding;

  if (profile.hook) {
    ctx.font = "bold 26px 'Inter', sans-serif";
    height += getWrappedLines(ctx, profile.hook, maxWidth).length * 34 + 12;
  }

  if (profile.bullets.length) {
    ctx.font = "22px 'Inter', sans-serif";
    for (const bullet of profile.bullets) {
      height += getWrappedLines(ctx, bullet, maxWidth - 28).length * 36 + 8;
    }
  }

  if (!profile.hook && !profile.bullets.length) {
    ctx.font = "24px 'Inter', sans-serif";
    height += 38;
  }

  return height + 10;
}

function drawProfileInCard(
  ctx: CanvasRenderingContext2D,
  profile: AssessmentProfile,
  cardX: number,
  cardY: number,
  _cardWidth: number,
  maxWidth: number,
  accentColor: string,
) {
  const textX = cardX + 30;
  let textY = cardY + 38;

  if (profile.hook) {
    ctx.fillStyle = accentColor;
    ctx.font = "bold 26px 'Inter', sans-serif";
    ctx.textAlign = "left";
    for (const line of getWrappedLines(ctx, profile.hook, maxWidth)) {
      ctx.fillText(line, textX, textY);
      textY += 34;
    }
    textY += 10;
  }

  if (profile.bullets.length) {
    for (const bullet of profile.bullets) {
      ctx.fillStyle = accentColor;
      ctx.font = "18px 'Inter', sans-serif";
      ctx.fillText("✦", textX, textY);

      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.font = "22px 'Inter', sans-serif";
      const lines = getWrappedLines(ctx, bullet, maxWidth - 28);
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], textX + 24, textY + i * 32);
      }
      textY += lines.length * 32 + 10;
    }
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

function drawGradientLine(ctx: CanvasRenderingContext2D, color: string, x1: number, x2: number, y: number) {
  const grad = ctx.createLinearGradient(x1, 0, x2, 0);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, "transparent");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function getWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const chars = text.split("");
  let line = "";
  for (const char of chars) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function loadImageViaBlobUrl(url: string): Promise<HTMLImageElement | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = objectUrl;
    });
  } catch {
    return null;
  }
}
