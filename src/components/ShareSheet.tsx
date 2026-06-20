import { X } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import {
  buildShareCopies,
  buildWeiboShareUrl,
  copyText,
  downloadImageDataUrl,
  resolveShareScene,
  type ShareCopyParams,
  type ShareScene,
} from "@/lib/shareChannels";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  imageDataUrl: string | null;
  title?: string;
  text?: string;
  url?: string;
  publicImageUrl?: string;
  scene?: ShareScene;
  sceneParams?: Omit<ShareCopyParams, "title" | "desc">;
}

type ChannelId = "save" | "wechat" | "xiaohongshu" | "weibo" | "copyText" | "copyLink";

const ShareSheet = ({
  open,
  onClose,
  imageDataUrl,
  title,
  text,
  publicImageUrl,
  scene,
  sceneParams,
}: ShareSheetProps) => {
  const { t } = useTranslation();
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(publicImageUrl || null);
  const [uploading, setUploading] = useState(false);

  const resolvedScene = resolveShareScene(scene);
  const shareTitle = title || t("shareSheet.defaultTitle", { defaultValue: "心灵密语" });

  const copies = useMemo(
    () =>
      buildShareCopies(t, resolvedScene, {
        title: shareTitle,
        desc: text,
        ...sceneParams,
      }),
    [t, resolvedScene, shareTitle, text, sceneParams],
  );

  useEffect(() => {
    if (!open || !imageDataUrl || publicImageUrl) return;
    let cancelled = false;
    setUploading(true);
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return;
        const res = await fetch(imageDataUrl);
        const blob = await res.blob();
        const fileName = `${uid}/poster_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;
        const { error } = await supabase.storage
          .from("shared-posters")
          .upload(fileName, blob, { contentType: "image/png", upsert: false });
        if (!error && !cancelled) {
          const { data } = supabase.storage.from("shared-posters").getPublicUrl(fileName);
          setUploadedUrl(data?.publicUrl || null);
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setUploading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, imageDataUrl, publicImageUrl]);

  useEffect(() => {
    if (!open) {
      setUploadedUrl(publicImageUrl || null);
      setUploading(false);
    }
  }, [open, publicImageUrl]);

  const handleSave = useCallback(async (silent = false) => {
    if (!imageDataUrl) return false;
    await downloadImageDataUrl(imageDataUrl);
    if (!silent) toast.success(t("shareSheet.savedToast"));
    return true;
  }, [imageDataUrl, t]);

  const handleCopyLink = useCallback(async () => {
    const ok = await copyText(copies.link);
    if (ok) toast.success(t("shareSheet.linkCopied"));
    else toast.error(t("shareSheet.copyFail", { defaultValue: "复制失败，请重试" }));
  }, [copies.link, t]);

  const handleCopyText = useCallback(async () => {
    const ok = await copyText(copies.wechat);
    if (ok) toast.success(t("shareSheet.textCopied"));
    else toast.error(t("shareSheet.copyFail", { defaultValue: "复制失败，请重试" }));
  }, [copies.wechat, t]);

  const handleWeChat = useCallback(async () => {
    if (!imageDataUrl) {
      const ok = await copyText(copies.wechat);
      if (ok) toast.success(t("shareSheet.wechatGuideTextOnly"), { duration: 4500 });
      return;
    }
    await handleSave(true);
    const ok = await copyText(copies.wechat);
    if (ok) toast.success(t("shareSheet.wechatGuide"), { duration: 4500 });
    else toast.error(t("shareSheet.copyFail", { defaultValue: "复制失败，请重试" }));
  }, [imageDataUrl, copies.wechat, handleSave, t]);

  const handleXiaohongshu = useCallback(async () => {
    if (!imageDataUrl) {
      const ok = await copyText(copies.xiaohongshu);
      if (ok) toast.success(t("shareSheet.xhsGuideTextOnly"), { duration: 4500 });
      return;
    }
    await handleSave(true);
    const ok = await copyText(copies.xiaohongshu);
    if (ok) toast.success(t("shareSheet.xhsGuide"), { duration: 4500 });
    else toast.error(t("shareSheet.copyFail", { defaultValue: "复制失败，请重试" }));
  }, [imageDataUrl, copies.xiaohongshu, handleSave, t]);

  const handleWeibo = useCallback(() => {
    if (uploading) {
      toast.info(t("shareSheet.uploading"));
      return;
    }
    const weiboUrl = buildWeiboShareUrl(copies.weibo, uploadedUrl);
    window.open(weiboUrl, "_blank", "noopener,noreferrer");
  }, [copies.weibo, uploadedUrl, uploading, t]);

  const channels: {
    id: ChannelId;
    label: string;
    hint?: string;
    icon: ReactNode;
    onClick: () => void;
    disabled?: boolean;
  }[] = [
    {
      id: "save",
      label: t("shareSheet.channels.save"),
      icon: <span className="text-lg">💾</span>,
      onClick: () => handleSave(false),
      disabled: !imageDataUrl,
    },
    {
      id: "wechat",
      label: t("shareSheet.channels.wechat"),
      hint: t("shareSheet.hints.manual"),
      icon: (
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#07C160] text-[11px] font-bold text-white">
          微
        </span>
      ),
      onClick: handleWeChat,
    },
    {
      id: "xiaohongshu",
      label: t("shareSheet.channels.xiaohongshu"),
      hint: t("shareSheet.hints.manual"),
      icon: (
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FF2442] text-[11px] font-bold text-white">
          红
        </span>
      ),
      onClick: handleXiaohongshu,
    },
    {
      id: "weibo",
      label: t("shareSheet.channels.weibo"),
      icon: (
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FF8200] text-[11px] font-bold text-white">
          博
        </span>
      ),
      onClick: handleWeibo,
      disabled: uploading,
    },
    {
      id: "copyText",
      label: t("shareSheet.channels.copyText"),
      icon: <span className="text-lg">📋</span>,
      onClick: handleCopyText,
    },
    {
      id: "copyLink",
      label: t("shareSheet.channels.copyLink"),
      icon: <span className="text-lg">🔗</span>,
      onClick: handleCopyLink,
    },
  ];

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base font-semibold">{t("shareSheet.title")}</DrawerTitle>
            <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </DrawerHeader>

        {imageDataUrl && (
          <div className="px-6 pb-3">
            <p className="mb-2 text-center text-[10px] text-muted-foreground">
              {t("shareSheet.previewHint", { defaultValue: "保存的图片与下方预览一致" })}
            </p>
            <div className="flex justify-center">
              <img
                src={imageDataUrl}
                alt={t("shareSheet.preview")}
                className="max-h-52 w-auto rounded-xl shadow-card object-contain"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-4 px-6 pb-6 pt-1">
          {channels.map(({ id, icon, label, hint, onClick, disabled }) => (
            <button
              key={id}
              type="button"
              onClick={onClick}
              disabled={disabled}
              className="flex flex-col items-center gap-1 text-foreground disabled:opacity-40 min-w-[56px]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted transition-colors hover:bg-muted/80 active:scale-95">
                {icon}
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight text-center">{label}</span>
              {hint && (
                <span className="text-[9px] text-muted-foreground/70 leading-none">{hint}</span>
              )}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ShareSheet;
