import { normalizeAssessmentProfile, profileToPlainText, type AssessmentProfile } from "@/lib/assessmentProfile";

interface Props {
  data: {
    description?: string;
    profileHook?: string;
    profileBullets?: string[];
  };
  className?: string;
  /** warm = soft cards for wellness / emotion results */
  variant?: "default" | "warm";
}

function bulletStartsWithEmoji(text: string): boolean {
  return /^[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(text.trim());
}

export default function AssessmentProfileCard({ data, className = "", variant = "default" }: Props) {
  const profile = normalizeAssessmentProfile(data);

  if (!profile.hook && !profile.bullets.length) {
    return null;
  }

  const warm = variant === "warm";

  return (
    <div className={`space-y-3 ${className}`}>
      {profile.hook && (
        <p
          className={`font-display leading-snug text-foreground ${
            warm ? "text-[16px] font-semibold text-gold-light/95" : "text-[15px] font-semibold"
          }`}
        >
          {profile.hook}
        </p>
      )}
      {profile.bullets.length > 0 && (
        <ul className={warm ? "space-y-2" : "space-y-2.5"}>
          {profile.bullets.map((bullet, i) => {
            const hasEmoji = bulletStartsWithEmoji(bullet);
            return (
              <li
                key={i}
                className={
                  warm
                    ? "rounded-xl border border-gold/15 bg-muted/40 px-3.5 py-2.5 text-sm text-foreground/90 leading-relaxed"
                    : "flex items-start gap-2.5 text-sm text-foreground/90 leading-relaxed"
                }
              >
                {warm ? (
                  <span>{bullet}</span>
                ) : (
                  <>
                    {!hasEmoji && (
                      <span className="mt-0.5 shrink-0 text-gold-light text-xs">✦</span>
                    )}
                    <span className={hasEmoji ? "" : ""}>{bullet}</span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export { normalizeAssessmentProfile, profileToPlainText, type AssessmentProfile };
