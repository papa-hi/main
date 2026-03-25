import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, CheckCircle2, Circle, ChevronRight, UserCircle, Users, CalendarPlus } from "lucide-react";

const DISMISSED_KEY = "onboarding_dismissed_v1";
const STEP2_KEY = "onboarding_step2_done";
const STEP3_KEY = "onboarding_step3_done";

interface StepRowProps {
  done: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
  onClick?: () => void;
}

function StepRow({ done, icon, title, description, to, onClick }: StepRowProps) {
  return (
    <Link to={to} onClick={onClick}>
      <div
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-primary/10 cursor-pointer ${done ? "opacity-50" : ""}`}
      >
        <div className="shrink-0 text-primary">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight ${done ? "line-through text-muted-foreground" : ""}`}>
            {title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
        </div>
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </div>
    </Link>
  );
}

export function OnboardingCard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [dismissed, setDismissed] = useState(true);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
    setStep2Done(localStorage.getItem(STEP2_KEY) === "true");
    setStep3Done(localStorage.getItem(STEP3_KEY) === "true");
  }, []);

  if (!user) return null;

  const childrenInfo = user.childrenInfo as { name: string; age: number }[] | null;
  const step1Done = !!(user.bio && user.city && childrenInfo && childrenInfo.length > 0);
  const allDone = step1Done && step2Done && step3Done;

  if (dismissed || allDone) return null;

  const completedCount = [step1Done, step2Done, step3Done].filter(Boolean).length;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  const handleStep2Click = () => {
    localStorage.setItem(STEP2_KEY, "true");
    setStep2Done(true);
  };

  const handleStep3Click = () => {
    localStorage.setItem(STEP3_KEY, "true");
    setStep3Done(true);
  };

  return (
    <div className="container mx-auto px-4 pt-4">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-orange-50/50 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base font-semibold leading-tight">
                {t("onboarding.title")}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("onboarding.progress", { count: completedCount, total: 3 })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
              aria-label={t("onboarding.dismiss")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Progress
            value={(completedCount / 3) * 100}
            className="h-1.5 mb-3"
          />

          <div className="space-y-0.5">
            <StepRow
              done={step1Done}
              icon={<UserCircle className="h-5 w-5" />}
              title={t("onboarding.step1Title")}
              description={t("onboarding.step1Desc")}
              to="/profile"
            />
            <StepRow
              done={step2Done}
              icon={<Users className="h-5 w-5" />}
              title={t("onboarding.step2Title")}
              description={t("onboarding.step2Desc")}
              to="/matches"
              onClick={handleStep2Click}
            />
            <StepRow
              done={step3Done}
              icon={<CalendarPlus className="h-5 w-5" />}
              title={t("onboarding.step3Title")}
              description={t("onboarding.step3Desc")}
              to="/create"
              onClick={handleStep3Click}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
