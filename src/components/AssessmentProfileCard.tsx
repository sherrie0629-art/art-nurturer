import { normalizeAssessmentProfile, type AssessmentProfile } from "@/lib/assessmentProfile";

interface Props {
  data: {
    description?: string;
    profileHook?: string;
    profileBullets?: string[];
  };
  className?: string;
}

export default function AssessmentProfileCard({ data, className = "" }: Props) {
  const profile = normalizeAssessmentProfile(data);

  if (!profile.hook && !profile.bullets.length) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {profile.hook && (
        <p className="font-display text-[15px] font-semibold leading-snug text-foreground">
          {profile.hook}
        </p>
      )}
      {profile.bullets.length > 0 && (
        <ul className="space-y-2.5">
          {profile.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/90 leading-relaxed">
              <span className="mt-0.5 shrink-0 text-secondary text-xs">✦</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { normalizeAssessmentProfile, type AssessmentProfile };
