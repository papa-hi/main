import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Check } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface AvailabilitySlot {
  dayOfWeek: number;
  dayName: string;
  timeSlot: string;
  timeSlotDisplay: string;
  isActive: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS_CONFIG = [
  { key: "morning", label: "Morning", emoji: "🌅" },
  { key: "afternoon", label: "Afternoon", emoji: "☀️" },
  { key: "evening", label: "Evening", emoji: "🌆" },
];

export function AvailabilityDisplay({ userId }: { userId: number }) {
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === userId;

  const { data, isLoading } = useQuery<{ availability: AvailabilitySlot[] }>({
    queryKey: ["/api/availability/user", userId],
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (activeSlots.size === 0) {
    return (
      <div className="text-center p-8 bg-muted/30 rounded-lg">
        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-heading font-medium text-lg mb-2">
          No availability set
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-4">
          {isOwnProfile
            ? "Set your weekly availability so other dads can see when you're free!"
            : "This dad hasn't set their availability yet."}
        </p>
        {isOwnProfile && (
          <Link href="/dad-days">
            <Button size="sm">Set My Dad Days</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-semibold" />
              {DAYS.map((day, i) => (
                <th
                  key={i}
                  className="px-1 py-2 text-center text-xs font-semibold text-foreground"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS_CONFIG.map((ts) => (
              <tr key={ts.key} className="border-b last:border-b-0">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{ts.emoji}</span>
                    <span className="text-xs font-medium">{ts.label}</span>
                  </div>
                </td>
                {DAYS.map((_, dayIndex) => {
                  const active = activeSlots.has(`${dayIndex}-${ts.key}`);
                  return (
                    <td key={dayIndex} className="px-1 py-2 text-center">
                      <div
                        className={`w-8 h-8 mx-auto rounded-md flex items-center justify-center ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/40"
                        }`}
                      >
                        {active && <Check className="w-4 h-4" />}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isOwnProfile && (
        <div className="mt-3 text-right">
          <Link href="/dad-days">
            <Button variant="outline" size="sm">
              Edit My Dad Days
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
