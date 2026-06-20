const POSTER_WIDTH = 750;
const POSTER_HEIGHT = 1000;
const PADDING = 56;

export interface ConstellationPosterConfig {
  appName: string;
  sectionLabel: string;
  constellationName: string;
  milestoneQuote: string;
  unlockDate: string;
  icon: string;
  agentName?: string;
  agentImageUrl?: string;
  footerCta: string;
  shareUrl: string;
}

async function ensureFonts() {
  if (typeof document === "undefined") return;
  if (document.fonts?.check('1em "DM Serif Display"')) return;
  try {
    await Promise.all([
      document.fonts.load('400 48px "DM Serif Display"'),
      document.fonts.load('400 24px "Inter"'),
    ]);
  } catch {
    /* fallback to system fonts */
  }
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const char of text) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rng = (seed: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  };
  for (let i = 0; i < 80; i++) {
    const x = rng(i + 1) * w;
    const y = rng(i + 2) * h;
    const r = rng(i + 3) * 1.8 + 0.4;
    ctx.fillStyle = `rgba(255,255,255,${0.15 + rng(i + 4) * 0.55})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
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

export async function generateConstellationPoster(
  config: ConstellationPosterConfig,
): Promise<HTMLCanvasElement> {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, 0, POSTER_HEIGHT);
  bg.addColorStop(0, "#0f1228");
  bg.addColorStop(0.45, "#1a1535");
  bg.addColorStop(1, "#0b1020");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  drawStars(ctx, POSTER_WIDTH, POSTER_HEIGHT);

  const glow = ctx.createRadialGradient(POSTER_WIDTH / 2, 280, 20, POSTER_WIDTH / 2, 280, 320);
  glow.addColorStop(0, "rgba(212, 168, 83, 0.18)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  const contentW = POSTER_WIDTH - PADDING * 2;
  let y = PADDING + 20;

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = '22px "Inter", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(config.sectionLabel, POSTER_WIDTH / 2, y);
  y += 48;

  ctx.font = '72px "Inter", sans-serif';
  ctx.fillText(config.icon, POSTER_WIDTH / 2, y);
  y += 36;

  if (config.agentImageUrl) {
    const img = await loadImage(config.agentImageUrl);
    if (img) {
      const size = 96;
      const cx = POSTER_WIDTH / 2;
      const cy = y + size / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
      ctx.restore();
      ctx.strokeStyle = "rgba(212, 168, 83, 0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.stroke();
      y += size + 28;
    }
  }

  ctx.fillStyle = "#f0d48a";
  ctx.font = 'bold 52px "DM Serif Display", Georgia, serif';
  const nameLines = wrapLines(ctx, config.constellationName, contentW);
  for (const line of nameLines.slice(0, 2)) {
    y += 58;
    ctx.fillText(line, POSTER_WIDTH / 2, y);
  }

  if (config.agentName) {
    y += 36;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = '24px "Inter", sans-serif';
    ctx.fillText(config.agentName, POSTER_WIDTH / 2, y);
  }

  y += 44;
  const quoteGrad = ctx.createLinearGradient(PADDING, 0, POSTER_WIDTH - PADDING, 0);
  quoteGrad.addColorStop(0, "transparent");
  quoteGrad.addColorStop(0.5, "rgba(212, 168, 83, 0.65)");
  quoteGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = quoteGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PADDING + 40, y);
  ctx.lineTo(POSTER_WIDTH - PADDING - 40, y);
  ctx.stroke();
  y += 36;

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = 'italic 26px "DM Serif Display", Georgia, serif';
  const quoteLines = wrapLines(ctx, config.milestoneQuote, contentW - 20);
  for (const line of quoteLines.slice(0, 4)) {
    ctx.fillText(line, POSTER_WIDTH / 2, y);
    y += 38;
  }

  y += 16;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = '22px "Inter", sans-serif';
  ctx.fillText(config.unlockDate, POSTER_WIDTH / 2, y);

  const footerY = POSTER_HEIGHT - PADDING - 36;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = '20px "Inter", sans-serif';
  ctx.fillText(config.footerCta, POSTER_WIDTH / 2, footerY - 28);
  ctx.fillStyle = "#d4a853";
  ctx.font = 'bold 24px "Inter", sans-serif';
  ctx.fillText(config.appName, POSTER_WIDTH / 2, footerY);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = '18px "Inter", sans-serif';
  ctx.fillText(config.shareUrl.replace(/^https?:\/\//, ""), POSTER_WIDTH / 2, footerY + 28);

  return canvas;
}
