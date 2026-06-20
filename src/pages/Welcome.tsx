import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, Heart, Lock, Map, MessageCircleHeart, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import { markOnboardingDone } from "@/lib/onboarding";

type OnboardingPath = "chat" | "assessment";

const fade = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

const Welcome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [path, setPath] = useState<OnboardingPath>("chat");

  const finish = (targetPath: OnboardingPath) => {
    markOnboardingDone();
    if (targetPath === "chat") {
      navigate("/chat?agent=nuannuan", { replace: true });
    } else {
      navigate("/assessment/mbti", { replace: true });
    }
  };

  const skip = () => {
    markOnboardingDone();
    navigate("/", { replace: true });
  };

  return (
    <div
      className="relative flex min-h-screen flex-col text-white"
      style={{
        background:
          "linear-gradient(180deg, hsl(225 50% 8%) 0%, hsl(260 40% 12%) 50%, hsl(225 45% 10%) 100%)",
      }}
    >
      <SEO
        title={`${t("home.appName")} — ${t("onboarding.step1.subline")}`}
        description={t("onboarding.step1.subline")}
      />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/50"
            style={{
              width: 2,
              height: 2,
              top: `${10 + i * 7}%`,
              left: `${(i * 17) % 100}%`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pb-10 pt-14">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-1 w-8 rounded-full transition-colors ${
                  n <= step ? "bg-[hsl(38_75%_55%)]" : "bg-white/15"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={skip}
            className="text-xs text-white/45 hover:text-white/70 transition-colors"
          >
            {t("onboarding.skip")}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" {...fade} className="flex flex-1 flex-col justify-center text-center">
              <p className="mb-3 text-xs tracking-[0.3em] uppercase text-[hsl(38_75%_65%)]">
                {t("home.appName")}
              </p>
              <h1 className="font-display text-3xl leading-tight md:text-4xl">
                {t("onboarding.step1.headline")}
              </h1>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/65">
                {t("onboarding.step1.subline")}
              </p>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="mx-auto mt-10 flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-primary-foreground"
                style={{
                  background: "linear-gradient(135deg, hsl(38 75% 55%), hsl(25 85% 60%))",
                }}
              >
                {t("onboarding.next")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" {...fade} className="flex flex-1 flex-col justify-center">
              <h2 className="text-center font-display text-2xl">{t("onboarding.step2.title")}</h2>
              <p className="mt-2 text-center text-sm text-white/55">{t("onboarding.step2.subtitle")}</p>
              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setPath("chat");
                    setStep(3);
                  }}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
                    path === "chat"
                      ? "border-[hsl(38_75%_55%/0.6)] bg-white/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/20">
                    <MessageCircleHeart className="h-6 w-6 text-rose-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t("onboarding.step2.chatTitle")}</p>
                    <p className="mt-0.5 text-xs text-white/55">{t("onboarding.step2.chatDesc")}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPath("assessment");
                    setStep(3);
                  }}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
                    path === "assessment"
                      ? "border-[hsl(38_75%_55%/0.6)] bg-white/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
                    <Brain className="h-6 w-6 text-indigo-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t("onboarding.step2.assessTitle")}</p>
                    <p className="mt-0.5 text-xs text-white/55">{t("onboarding.step2.assessDesc")}</p>
                  </div>
                </button>
              </div>
              <p className="mt-6 text-center text-[11px] text-white/40">{t("onboarding.step2.hint")}</p>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" {...fade} className="flex flex-1 flex-col justify-center">
              <h2 className="text-center font-display text-2xl">{t("onboarding.step3.title")}</h2>
              <p className="mt-2 text-center text-sm text-white/55">{t("onboarding.step3.subtitle")}</p>
              <ul className="mt-8 space-y-4">
                {(
                  [
                    { icon: Heart, key: "bond" },
                    { icon: Lock, key: "secrets" },
                    { icon: Map, key: "map" },
                  ] as const
                ).map(({ icon: Icon, key }) => (
                  <li key={key} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(38_75%_65%)]" />
                    <div>
                      <p className="text-sm font-medium">{t(`onboarding.step3.items.${key}.title`)}</p>
                      <p className="mt-0.5 text-xs text-white/55">
                        {t(`onboarding.step3.items.${key}.desc`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => finish(path)}
                className="mx-auto mt-10 flex items-center gap-2 rounded-full px-10 py-4 text-sm font-semibold text-primary-foreground"
                style={{
                  background: "linear-gradient(135deg, hsl(38 75% 55%), hsl(25 85% 60%))",
                  boxShadow: "0 0 30px -5px hsl(38 75% 55% / 0.4)",
                }}
              >
                <Sparkles className="h-4 w-4" />
                {t("onboarding.step3.start")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Welcome;
