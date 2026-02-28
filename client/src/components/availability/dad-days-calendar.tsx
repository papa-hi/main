import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Calendar, Check, Trash2, Save, Users, ArrowRight } from "lucide-react";

interface TimeSlot {
  dayOfWeek: number;
  timeSlot: "morning" | "afternoon" | "evening" | "allday";
  notes?: string;
}

interface AvailabilityData {
  id: number;
  dayOfWeek: number;
  dayName: string;
  timeSlot: string;
  timeSlotDisplay: string;
  isActive: boolean;
  notes?: string;
  nextOccurrence: string;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const TIME_SLOTS_CONFIG = [
  { key: "morning", emoji: "🌅" },
  { key: "afternoon", emoji: "☀️" },
  { key: "evening", emoji: "🌆" },
] as const;

function SlotStats({ day, slot }: { day: number; slot: string }) {
  const { data } = useQuery<{
    dayName: string;
    timeSlotDisplay: string;
    availableDadsCount: number;
    newThisWeek: number;
    message: string;
  }>({
    queryKey: ["/api/availability/stats/slot", day, slot],
    staleTime: 60000,
  });

  if (!data) return null;

  return (
    <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-popover text-popover-foreground text-xs rounded-lg p-2 shadow-lg border">
      <div className="font-semibold mb-1">
        {data.dayName} {data.timeSlotDisplay}
      </div>
      <div className="space-y-1">
        <div>👥 {data.availableDadsCount} dads nearby</div>
        {data.newThisWeek > 0 && (
          <div>🆕 {data.newThisWeek} joined this week</div>
        )}
        <div className="text-muted-foreground">{data.message}</div>
      </div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
    </div>
  );
}

function MatchesPreview() {
  const { t } = useTranslation();
  const { data } = useQuery<{
    totalMatches: number;
    matches: any[];
  }>({
    queryKey: ["/api/availability/matches"],
  });

  if (!data || data.totalMatches === 0) return null;

  return (
    <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
      <CardContent className="pt-6">
        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
          🎯 {t('dadDays.matchesTitle', { count: data.totalMatches })}
        </h3>
        <p className="text-green-700 dark:text-green-300 text-sm mb-3">
          {t('dadDays.matchesSubtitle')}
        </p>
        <Link href="/matches">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {t('dadDays.viewAllMatches')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function DadDaysCalendar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState<{
    day: number;
    slot: string;
  } | null>(null);

  const { data: availabilityData, isLoading } = useQuery<{
    availability: AvailabilityData[];
  }>({
    queryKey: ["/api/availability"],
  });

  useEffect(() => {
    if (availabilityData?.availability) {
      const slots = new Set<string>();
      availabilityData.availability.forEach((slot: AvailabilityData) => {
        if (slot.isActive) {
          slots.add(`${slot.dayOfWeek}-${slot.timeSlot}`);
        }
      });
      setSelectedSlots(slots);
    }
  }, [availabilityData]);

  const saveAvailability = useMutation({
    mutationFn: async (availability: TimeSlot[]) => {
      const res = await apiRequest("POST", "/api/availability", {
        availability,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/availability/matches"],
      });
      toast({
        title: t('dadDays.saved'),
        description: data.message || t('dadDays.savedDescription'),
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: t('dadDays.errorSave'),
        variant: "destructive",
      });
    },
  });

  const toggleSlot = useMutation({
    mutationFn: async ({ day, slot }: { day: number; slot: string }) => {
      const res = await apiRequest("POST", "/api/availability/toggle", {
        dayOfWeek: day,
        timeSlot: slot,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/availability/matches"],
      });
    },
  });

  const handleSlotClick = (dayOfWeek: number, timeSlot: string) => {
    const key = `${dayOfWeek}-${timeSlot}`;
    const newSelected = new Set(selectedSlots);

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }

    setSelectedSlots(newSelected);
    toggleSlot.mutate({ day: dayOfWeek, slot: timeSlot });
  };

  const handleSave = () => {
    const availability: TimeSlot[] = Array.from(selectedSlots).map((key) => {
      const [day, slot] = key.split("-");
      return {
        dayOfWeek: parseInt(day),
        timeSlot: slot as "morning" | "afternoon" | "evening" | "allday",
      };
    });

    saveAvailability.mutate(availability);
  };

  const clearAvailability = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/availability", {
        availability: [],
      });
      return res.json();
    },
    onSuccess: () => {
      setSelectedSlots(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/availability/matches"],
      });
      toast({
        title: t('dadDays.cleared'),
        description: t('dadDays.clearedDescription'),
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: t('dadDays.errorClear'),
        variant: "destructive",
      });
    },
  });

  const handleClear = () => {
    setSelectedSlots(new Set());
    clearAvailability.mutate();
  };

  const isSlotSelected = (day: number, slot: string) => {
    return selectedSlots.has(`${day}-${slot}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 24 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 py-4 sm:px-4 md:px-6 md:py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Calendar className="h-7 w-7 text-primary" />
          {t('dadDays.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('dadDays.subtitle')}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[72px] sm:w-[100px] md:w-[120px]" />
                {DAY_KEYS.map((_, i) => (
                  <col key={i} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-1 sm:px-2 md:px-4 py-2 md:py-3 text-left text-xs sm:text-sm font-semibold">
                    {t('dadDays.time')}
                  </th>
                  {DAY_KEYS.map((dayKey, index) => (
                    <th
                      key={index}
                      className="px-0 py-2 md:py-3 text-center text-[11px] sm:text-xs md:text-sm font-semibold text-foreground"
                    >
                      {t(`dadDays.${dayKey}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS_CONFIG.map((timeSlot) => (
                  <tr key={timeSlot.key} className="border-b last:border-b-0">
                    <td className="px-1 sm:px-2 md:px-4 py-2 md:py-3">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-base sm:text-xl">{timeSlot.emoji}</span>
                        <div>
                          <div className="font-medium text-xs sm:text-sm">
                            {t(`dadDays.${timeSlot.key}`)}
                          </div>
                          <div className="text-xs text-muted-foreground hidden sm:block">
                            {t(`dadDays.${timeSlot.key}Time`)}
                          </div>
                        </div>
                      </div>
                    </td>
                    {DAY_KEYS.map((_, dayIndex) => (
                      <td
                        key={dayIndex}
                        className="px-0 py-2 md:py-3 text-center"
                      >
                        <button
                          onClick={() =>
                            handleSlotClick(dayIndex, timeSlot.key)
                          }
                          onMouseEnter={() =>
                            setShowStats({ day: dayIndex, slot: timeSlot.key })
                          }
                          onMouseLeave={() => setShowStats(null)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto rounded-lg border-2 transition-all relative flex items-center justify-center ${
                            isSlotSelected(dayIndex, timeSlot.key)
                              ? "bg-primary border-primary text-primary-foreground shadow-md scale-105"
                              : "bg-background border-border hover:border-primary/50 hover:bg-primary/10"
                          }`}
                        >
                          {isSlotSelected(dayIndex, timeSlot.key) && (
                            <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}

                          {showStats?.day === dayIndex &&
                            showStats?.slot === timeSlot.key && (
                              <SlotStats day={dayIndex} slot={timeSlot.key} />
                            )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedSlots.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">
              ✅ {t('dadDays.selectedSlots', { count: selectedSlots.size })}
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedSlots)
                .sort()
                .map((key) => {
                  const [day, slot] = key.split("-");
                  const timeSlotInfo = TIME_SLOTS_CONFIG.find(
                    (ts) => ts.key === slot
                  );
                  return (
                    <Badge key={key} variant="secondary" className="gap-1">
                      {timeSlotInfo?.emoji} {t(`dadDays.${DAY_KEYS[parseInt(day)]}`)} {t(`dadDays.${slot}`)}
                    </Badge>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      <MatchesPreview />

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saveAvailability.isPending}
          className="flex-1"
          size="lg"
        >
          <Save className="mr-2 h-4 w-4" />
          {saveAvailability.isPending ? t('dadDays.saving') : t('dadDays.saveDadDays')}
        </Button>
        <Button
          onClick={handleClear}
          variant="outline"
          size="lg"
          disabled={selectedSlots.size === 0 || clearAvailability.isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {clearAvailability.isPending ? t('dadDays.clearing') : t('dadDays.clearAll')}
        </Button>
      </div>
    </div>
  );
}

export default DadDaysCalendar;
