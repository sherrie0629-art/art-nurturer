import { useTranslation } from "react-i18next";
import type { Agent } from "@/data/agents";
import { getAgentWelcome } from "@/lib/localizeAgent";

interface Props {
  agent: Agent;
  className?: string;
}

const AgentWelcomeIntro = ({ agent, className = "" }: Props) => {
  const { t } = useTranslation();
  const text = getAgentWelcome(agent, t);

  return (
    <p className={`text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 ${className}`}>
      {text}
    </p>
  );
};

export default AgentWelcomeIntro;
