import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, MessageCircleHeart } from "lucide-react";
import { useTranslation } from "react-i18next";
import BottomNav from "@/components/BottomNav";
import DesktopLayout from "@/components/DesktopLayout";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { agents as RAW_AGENTS } from "@/data/agents";
import { canonicalAgentId } from "@/lib/agentIdAliases";

const Notifications = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, promptLogin } = useAuth();
  const { items, loading, unreadCount, markRead, markAllRead } = useNotifications(user?.id);

  const openNotification = async (n: (typeof items)[0]) => {
    if (!n.read_at) await markRead(n.id);
    if (n.type === "agent_followup" && n.agent_id) {
      navigate(`/chat?agent=${canonicalAgentId(n.agent_id)}`, {
        state: {
          followupNotification: {
            id: n.id,
            agentId: n.agent_id,
            title: n.title,
            body: n.body,
            topic: n.title,
          },
        },
      });
      return;
    }
  };

  if (!user) {
    return (
      <DesktopLayout>
        <SEO title={t("notifications.title")} description={t("notifications.subtitle")} />
        <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-24">
          <Bell className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("notifications.signInHint")}</p>
          <button
            type="button"
            onClick={() => promptLogin(t("notifications.signInHint"))}
            className="mt-4 text-sm text-primary underline"
          >
            {t("auth.signInUp")}
          </button>
          <BottomNav />
        </div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout>
      <div className="min-h-screen bg-gradient-calm pb-24 md:pb-8">
        <SEO title={t("notifications.title")} description={t("notifications.subtitle")} />
        <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-base font-semibold text-foreground">{t("notifications.title")}</h1>
              <p className="text-[11px] text-muted-foreground">{t("notifications.subtitle")}</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="text-[11px] text-primary font-medium"
            >
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        <div className="px-4 py-4">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t("notifications.empty")}</p>
              <p className="mt-2 text-xs text-muted-foreground/70 max-w-xs mx-auto">{t("notifications.emptyHint")}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((n, i) => {
                const agent = RAW_AGENTS.find((a) => a.id === canonicalAgentId(n.agent_id || ""));
                const unread = !n.read_at;
                return (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className={`flex w-full gap-3 rounded-2xl border p-4 text-left transition-colors ${
                        unread
                          ? "border-primary/25 bg-primary/5 shadow-sm"
                          : "border-border bg-card shadow-card"
                      }`}
                    >
                      {agent ? (
                        <img
                          src={agent.image}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <MessageCircleHeart className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-display text-sm font-semibold text-foreground truncate">
                            {n.title}
                          </p>
                          {unread && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>
                        <p className="mt-2 text-[10px] text-muted-foreground/60">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>

        <BottomNav />
      </div>
    </DesktopLayout>
  );
};

export default Notifications;
