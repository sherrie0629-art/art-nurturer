import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getBondProgressInLevel } from "@/data/agents";
import { getNextChatProgressHint } from "@/lib/chatProgressHints";

interface Props {
  totalTurns: number;
  bondLevel: number;
  isLoggedIn: boolean;
}

const ChatProgressBar = ({ totalTurns, bondLevel, isLoggedIn }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const hint = useMemo(
    () => getNextChatProgressHint(totalTurns, bondLevel, isLoggedIn),
    [totalTurns, bondLevel, isLoggedIn],
  );

  if (!hint) return null;

  const message =
    hint.kind === "guest"
      ? t("chatProgress.guest")
      : hint.kind === "lore"
        ? t("chatProgress.lore", { n: hint.turnsRemaining, level: hint.nextBondLevel })
        : hint.kind === "mirror"
          ? t("chatProgress.mirror", { n: hint.turnsRemaining })
          : t("chatProgress.fragment", { n: hint.turnsRemaining });

  const progressPct = useMemo(() => {
    if (hint.kind === "guest") return 0;
    if (hint.kind === "lore") return getBondProgressInLevel(bondLevel, totalTurns);
    const interval = hint.kind === "mirror" ? 15 : 10;
    return Math.min(100, Math.max(8, ((interval - hint.turnsRemaining) / interval) * 100));
  }, [hint, bondLevel, totalTurns]);

  const handleClick = () => {
    if (hint.kind === "guest") {
      navigate("/auth?redirect=/chat");
      return;
    }
    navigate("/archive");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full border-b border-primary/15 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-4 py-2 text-left transition-colors hover:from-primary/25 hover:via-primary/15"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] text-primary">{message}</p>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary/70" />
      </div>
      {hint.kind !== "guest" && (
        <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-primary/15">
          <div
            className="h-full rounded-full bg-gradient-golden transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </button>
  );
};

export default ChatProgressBar;
