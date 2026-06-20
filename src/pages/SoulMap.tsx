import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAchievements } from "@/hooks/useAchievements";
import { ACHIEVEMENTS, type AchievementDef } from "@/data/achievements";
import { canonicalAgentId } from "@/lib/agentIdAliases";
import { agents } from "@/data/agents";
import type { SoulFragmentData } from "@/lib/soulFragmentRules";
import SoulMapSummaryHero from "@/components/SoulMapSummaryHero";
import SoulMapAllStarsSheet from "@/components/SoulMapAllStarsSheet";
import SoulMapConstellationPreview from "@/components/SoulMapConstellationPreview";
import SoulMapConstellationCatalogSheet from "@/components/SoulMapConstellationCatalogSheet";
import SoulMapConstellationDetailDialog from "@/components/SoulMapConstellationDetailDialog";
import ShareSheet from "@/components/ShareSheet";
import { sortUnlockedAchievements } from "@/lib/constellationMilestone";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DesktopLayout from "@/components/DesktopLayout";
import SEO from "@/components/SEO";

interface SoulFragment extends SoulFragmentData {}

const agentNameById = (id: string | null) => {
  if (!id) return undefined;
  return agents.find((a) => a.id === canonicalAgentId(id))?.name;
};

const SoulMap = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, promptLogin } = useAuth();
  const { unlockedIds, unlockedRecords, checkAchievements } = useAchievements(user?.id);
  const [fragments, setFragments] = useState<SoulFragment[]>([]);
  const [reportByType, setReportByType] = useState<Record<string, string>>({});
  const [allStarsOpen, setAllStarsOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [selectedFragment, setSelectedFragment] = useState<SoulFragment | null>(null);
  const [selectedConstellation, setSelectedConstellation] = useState<AchievementDef | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [shareTitle, setShareTitle] = useState("");
  const [shareDesc, setShareDesc] = useState("");
  const [shareAgentName, setShareAgentName] = useState<string | undefined>();
  const constellationRef = useRef<HTMLDivElement>(null);

  const sourceLabels: Record<string, string> = {
    mbti: t("assessmentReports.labels.mbti"),
    enneagram: t("assessmentReports.labels.enneagram"),
    zodiac: t("assessmentReports.labels.zodiac"),
    emotion: t("assessmentReports.labels.emotion"),
    chat: t("soulMap.chat"),
  };

  useEffect(() => {
    if (!user) {
      promptLogin(t("auth.promptViewSoulMap"));
      navigate("/");
      return;
    }
    Promise.all([
      (supabase as any)
        .from("soul_fragments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("assessment_results")
        .select("id, assessment_type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]).then(([fragRes, reportRes]: any[]) => {
      if (fragRes.data) setFragments(fragRes.data);
      const map: Record<string, string> = {};
      for (const row of reportRes.data || []) {
        if (!map[row.assessment_type]) map[row.assessment_type] = row.id;
      }
      setReportByType(map);
    });
  }, [user, promptLogin, navigate, t]);

  useEffect(() => {
    if (user) checkAchievements();
  }, [user, checkAchievements]);

  const unlocked = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id));
  const locked = ACHIEVEMENTS.filter((a) => !unlockedIds.includes(a.id));
  const recentUnlocked = useMemo(
    () => sortUnlockedAchievements(unlocked, unlockedRecords).slice(0, 2),
    [unlocked, unlockedRecords],
  );
  const nextLocked = locked[0];

  const sortedFragments = useMemo(
    () => [...fragments].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [fragments],
  );

  const latestFragment = sortedFragments[0];
  const secondFragment = sortedFragments[1];

  const summaryInsight = useMemo(() => {
    if (sortedFragments.length === 0) return t("soulMap.summaryInsightEmpty");
    const chatCount = sortedFragments.filter((f) => f.source_type === "chat").length;
    const assessCount = sortedFragments.length - chatCount;
    if (latestFragment?.description) {
      if (chatCount > 0 && assessCount > 0) {
        return t("soulMap.summaryInsightMixed", { line: latestFragment.description });
      }
      return latestFragment.description;
    }
    return t("soulMap.summaryInsightNamed", { name: latestFragment.name });
  }, [sortedFragments, latestFragment, t]);

  const fragmentMeta = (f: SoulFragment) => {
    const date = new Date(f.created_at).toLocaleDateString(i18n.language === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
    });
    if (f.source_type === "chat" && f.source_agent) {
      return `${t("soulMap.fragmentFrom", { agent: agentNameById(f.source_agent) || f.source_agent })} · ${date}`;
    }
    return `${sourceLabels[f.source_type] || f.source_type} · ${date}`;
  };

  const fragmentSubtitle = (f: SoulFragment) => {
    if (f.source_type === "chat" && f.source_agent) {
      return t("soulMap.fragmentFrom", { agent: agentNameById(f.source_agent) || f.source_agent });
    }
    return undefined;
  };

  const fragmentAction = (f: SoulFragment) => {
    if (f.source_type === "chat" && f.source_agent) {
      return {
        label: t("soulMap.actionContinueChat", { agent: agentNameById(f.source_agent) || "" }),
        onClick: () => navigate(`/chat?agent=${canonicalAgentId(f.source_agent)}`),
      };
    }
    const reportId = reportByType[f.source_type];
    return {
      label: t("soulMap.actionViewReport"),
      onClick: () => navigate(reportId ? `/assessment-reports/${reportId}` : "/assessment-reports"),
    };
  };

  const scrollToConstellations = () => {
    constellationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleConstellationShare = (
    imageDataUrl: string,
    title: string,
    desc: string,
    agentName?: string,
  ) => {
    setShareImageUrl(imageDataUrl);
    setShareTitle(title);
    setShareDesc(desc);
    setShareAgentName(agentName);
    setShareOpen(true);
  };

  return (
    <DesktopLayout maxWidth="4xl">
      <div
        className="min-h-screen pb-12"
        style={{ background: "linear-gradient(180deg, hsl(225 50% 8%), hsl(260 40% 12%), hsl(225 45% 10%))" }}
      >
        <SEO title={`${t("soulMap.title")} — ${t("home.appName")}`} description={t("soulMap.seoDescription")} />

        <div className="flex items-center gap-3 px-5 pt-12 pb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-display text-lg font-semibold text-white/90">{t("soulMap.title")}</h1>
        </div>

        <SoulMapSummaryHero
          starCount={fragments.length}
          constellationCount={unlocked.length}
          insight={summaryInsight}
          latest={latestFragment}
          secondLatest={secondFragment}
          latestMeta={latestFragment ? fragmentMeta(latestFragment) : undefined}
          secondMeta={secondFragment ? fragmentMeta(secondFragment) : undefined}
          onOpenLatest={() => latestFragment && setSelectedFragment(latestFragment)}
          onOpenSecond={() => secondFragment && setSelectedFragment(secondFragment)}
          onViewAll={() => setAllStarsOpen(true)}
          onViewConstellations={scrollToConstellations}
        />

        <div ref={constellationRef}>
          <SoulMapConstellationPreview
            recentUnlocked={recentUnlocked}
            nextLocked={nextLocked}
            totalUnlocked={unlocked.length}
            totalCount={ACHIEVEMENTS.length}
            unlockRecords={unlockedRecords}
            onOpenAchievement={setSelectedConstellation}
            onOpenCatalog={() => setCatalogOpen(true)}
            onChatWithAgent={(agentId) => navigate(`/chat?agent=${agentId}`)}
          />
        </div>

        <SoulMapAllStarsSheet
          open={allStarsOpen}
          onOpenChange={setAllStarsOpen}
          fragments={sortedFragments}
          sourceLabels={sourceLabels}
          fragmentSubtitle={fragmentSubtitle}
          fragmentAction={fragmentAction}
          onOpenFragment={(f) => {
            setAllStarsOpen(false);
            setSelectedFragment(f);
          }}
        />

        <SoulMapConstellationCatalogSheet
          open={catalogOpen}
          onOpenChange={setCatalogOpen}
          unlockedIds={unlockedIds}
          onSelect={setSelectedConstellation}
        />

        <SoulMapConstellationDetailDialog
          achievement={selectedConstellation}
          unlockedIds={unlockedIds}
          unlockRecords={unlockedRecords}
          fragments={sortedFragments}
          onClose={() => setSelectedConstellation(null)}
          onChat={(agentId) => navigate(`/chat?agent=${agentId}`)}
          onOpenFragment={setSelectedFragment}
          onShare={handleConstellationShare}
        />

        <ShareSheet
          open={shareOpen}
          onClose={() => {
            setShareOpen(false);
            setShareImageUrl(null);
          }}
          imageDataUrl={shareImageUrl}
          title={shareTitle}
          text={shareDesc}
          scene="constellation"
          sceneParams={{ agentName: shareAgentName, typeLabel: shareTitle }}
        />

        <Dialog open={!!selectedFragment} onOpenChange={() => setSelectedFragment(null)}>
          <DialogContent className="max-w-sm rounded-2xl">
            {selectedFragment && (
              <>
                <DialogHeader className="items-center text-center">
                  <div
                    className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${selectedFragment.color}22`,
                      boxShadow: `0 0 24px -4px ${selectedFragment.color}80`,
                      border: `1px solid ${selectedFragment.color}40`,
                    }}
                  >
                    <span className="text-3xl">{selectedFragment.icon}</span>
                  </div>
                  <DialogTitle className="font-display text-lg">{selectedFragment.name}</DialogTitle>
                  {selectedFragment.description && (
                    <DialogDescription
                      className="text-sm leading-relaxed italic text-muted-foreground"
                      style={{ fontFamily: i18n.language.startsWith("zh") ? '"Noto Serif SC", serif' : "Georgia, serif" }}
                    >
                      {i18n.language.startsWith("zh")
                        ? `「${selectedFragment.description}」`
                        : `"${selectedFragment.description}"`}
                    </DialogDescription>
                  )}
                </DialogHeader>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border">
                  <span>
                    {selectedFragment.source_agent
                      ? t("soulMap.fragmentFrom", {
                          agent: agentNameById(selectedFragment.source_agent) || selectedFragment.source_agent,
                        })
                      : t("soulMap.source", {
                          src: sourceLabels[selectedFragment.source_type] || selectedFragment.source_type,
                        })}
                  </span>
                  <span>
                    {new Date(selectedFragment.created_at).toLocaleDateString(
                      i18n.language === "zh" ? "zh-CN" : "en-US",
                    )}
                  </span>
                </div>
                <div className="pt-3 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      const action = fragmentAction(selectedFragment);
                      setSelectedFragment(null);
                      action.onClick();
                    }}
                    className="rounded-2xl bg-gradient-golden px-6 py-2.5 text-sm font-medium text-primary-foreground active:scale-95 transition-transform"
                  >
                    {fragmentAction(selectedFragment).label}
                  </button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DesktopLayout>
  );
};

export default SoulMap;
