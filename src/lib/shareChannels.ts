import type { TFunction } from "i18next";

export const SHARE_URL = "https://islandai.life";

export type ShareScene =
  | "mbti"
  | "enneagram"
  | "zodiac"
  | "emotion"
  | "compatibility"
  | "deepReport"
  | "chat"
  | "assessment"
  | "constellation";

export interface ShareCopyParams {
  title: string;
  desc?: string;
  typeLabel?: string;
  score?: number;
  agentName?: string;
}

export interface ShareCopies {
  wechat: string;
  xiaohongshu: string;
  weibo: string;
  link: string;
}

const SCENE_HASHTAG: Record<ShareScene, string> = {
  mbti: "MBTI",
  enneagram: "九型人格",
  zodiac: "星座",
  emotion: "心灵体检",
  compatibility: "缘分合盘",
  deepReport: "深度心理报告",
  chat: "AI陪伴",
  assessment: "心理测评",
  constellation: "灵魂星图",
};

export function resolveShareScene(scene?: ShareScene, fallback?: string): ShareScene {
  const valid: ShareScene[] = [
    "mbti", "enneagram", "zodiac", "emotion",
    "compatibility", "deepReport", "chat", "assessment", "constellation",
  ];
  if (scene && valid.includes(scene)) return scene;
  if (fallback && valid.includes(fallback as ShareScene)) return fallback as ShareScene;
  return "assessment";
}

export function buildShareCopies(t: TFunction, scene: ShareScene, params: ShareCopyParams): ShareCopies {
  const desc = (params.desc || "").trim();
  const base = {
    title: params.title || t("shareSheet.defaultTitle", { defaultValue: "心灵密语" }),
    desc: desc || t("shareSheet.defaultDesc", { defaultValue: "来测测你的内在地图" }),
    typeLabel: params.typeLabel || "",
    score: params.score !== undefined ? params.score : "",
    agentName: params.agentName || "",
    url: SHARE_URL,
    hashtag: SCENE_HASHTAG[scene],
  };

  const key = (field: "wechat" | "xiaohongshu" | "weibo") =>
    t(`shareSheet.scenes.${scene}.${field}`, { ...base, defaultValue: "" }) ||
    t(`shareSheet.scenes.assessment.${field}`, { ...base, defaultValue: "" });

  return {
    wechat: key("wechat"),
    xiaohongshu: key("xiaohongshu"),
    weibo: key("weibo"),
    link: SHARE_URL,
  };
}

export function buildWeiboShareUrl(title: string, pic?: string | null): string {
  const q = new URLSearchParams({
    url: SHARE_URL,
    title,
  });
  if (pic) q.set("pic", pic);
  return `https://service.weibo.com/share/share.php?${q.toString()}`;
}

export async function downloadImageDataUrl(dataUrl: string, filename = "mindgarden-share.png"): Promise<void> {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
