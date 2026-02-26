import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Calendar, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface AvailabilitySlot {
  dayOfWeek: number;
  dayName: string;
  timeSlot: string;
  timeSlotDisplay: string;
  isActive: boolean;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const TIME_SLOTS_CONFIG = [
  { key: "morning", emoji: "🌅" },
  { key: "afternoon", emoji: "☀️" },
  { key: "evening", emoji: "🌆" },
] as const;

export function AvailabilityDisplay({
  userId,
  isOwnProfile = false,
}: {
  userId: number;
  isOwnProfile?: boolean;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery<{ availability: AvailabilitySlot[] }>({
    queryKey: ["/api/availability", "user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/availability/user/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const activeSlots = new Set(
    data?.availability
      ?.filter((s) => s.isActive)
      .map((s) => `${s.dayOfWeek}-${s.timeSlot}`) || []
  );

  if (isLoading) return null;

  if (activeSlots.size === 0 && !isOwnProfile) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold font-heading flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {isOwnProfile ? t('dadDays.myDadDays') : t('dadDays.availableForPlaydates')}
        </h2>
        {isOwnProfile && (
          <Link href="/dad-days">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-1" />
              {activeSlots.size === 0 ? t('dadDays.setUp') : t('dadDays.edit')}
            </Button>
          </Link>
        )}
      </div>

      {activeSlots.size === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('dadDays.noAvailability')}{" "}
          {isOwnProfile && (
            <Link href="/dad-days" className="text-primary underline">
              {t('dadDays.setYourDadDays')}
            </Link>
          )}
        </p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground w-20"></th>
                {DAY_KEYS.map((dayKey) => (
                  <th
                    key={dayKey}
                    className="px-1 py-1.5 text-center text-xs font-medium text-muted-foreground"
                  >
                    {t(`dadDays.${dayKey}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS_CONFIG.map((slot) => (
                <tr key={slot.key} className="border-b last:border-b-0">
                  <td className="px-2 py-1.5 text-xs">
                    <span className="mr-1">{slot.emoji}</span>
                    <span className="hidden sm:inline">{t(`dadDays.${slot.key}`)}</span>
                  </td>
                  {DAY_KEYS.map((_, dayIndex) => {
                    const isActive = activeSlots.has(
                      `${dayIndex}-${slot.key}`
                    );
                    return (
                      <td key={dayIndex} className="px-1 py-1.5 text-center">
                        <div
                          className={`w-7 h-7 mx-auto rounded-md flex items-center justify-center text-xs ${
                            isActive
                              ? "bg-primary/20 text-primary font-semibold"
                              : "bg-muted/30 text-muted-foreground/30"
                          }`}
                        >
                          {isActive ? "✓" : "·"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AvailabilityDisplay;
