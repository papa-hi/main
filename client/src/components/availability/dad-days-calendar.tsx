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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_SLOTS_CONFIG = [
  { key: "morning", label: "Morning", emoji: "🌅", time: "7am - 12pm" },
  { key: "afternoon", label: "Afternoon", emoji: "☀️", time: "12pm - 5pm" },
  { key: "evening", label: "Evening", emoji: "🌆", time: "5pm - 8pm" },
];

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
          🎯 {data.totalMatches} dad{data.totalMatches !== 1 ? "s" : ""} match
          your schedule!
        </h3>
        <p className="text-green-700 dark:text-green-300 text-sm mb-3">
          These dads are free at the same times as you. Start connecting!
        </p>
        <Link href="/matches">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            View All Matches
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
        title: "Saved!",
        description: data.message || "Your availability has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save availability. Please try again.",
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

  const handleClear = () => {
    setSelectedSlots(new Set());
    saveAvailability.mutate([]);
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
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Calendar className="h-7 w-7 text-primary" />
          Your Dad Days Calendar
        </h1>
        <p className="text-muted-foreground mt-1">
          Mark when you're usually free for playdates. We'll match you with dads
          who share your schedule!
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Time
                  </th>
                  {DAYS.map((day, index) => (
                    <th
                      key={index}
                      className="px-1 md:px-2 py-3 text-center text-sm font-semibold"
                    >
                      <span className="hidden md:inline">{day}</span>
                      <span className="md:hidden">{day.charAt(0)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS_CONFIG.map((timeSlot) => (
                  <tr key={timeSlot.key} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{timeSlot.emoji}</span>
                        <div>
                          <div className="font-medium text-sm">
                            {timeSlot.label}
                          </div>
                          <div className="text-xs text-muted-foreground hidden sm:block">
                            {timeSlot.time}
                          </div>
                        </div>
                      </div>
                    </td>
                    {DAYS.map((_, dayIndex) => (
                      <td
                        key={dayIndex}
                        className="px-1 md:px-2 py-3 text-center"
                      >
                        <button
                          onClick={() =>
                            handleSlotClick(dayIndex, timeSlot.key)
                          }
                          onMouseEnter={() =>
                            setShowStats({ day: dayIndex, slot: timeSlot.key })
                          }
                          onMouseLeave={() => setShowStats(null)}
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 transition-all relative flex items-center justify-center ${
                            isSlotSelected(dayIndex, timeSlot.key)
                              ? "bg-primary border-primary text-primary-foreground shadow-md scale-105"
                              : "bg-background border-border hover:border-primary/50 hover:bg-primary/10"
                          }`}
                        >
                          {isSlotSelected(dayIndex, timeSlot.key) && (
                            <Check className="h-5 w-5" />
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
              ✅ You've selected {selectedSlots.size} time slot
              {selectedSlots.size !== 1 ? "s" : ""}
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
                      {timeSlotInfo?.emoji} {FULL_DAYS[parseInt(day)]}{" "}
                      {timeSlotInfo?.label}
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
          {saveAvailability.isPending ? "Saving..." : "Save Dad Days"}
        </Button>
        <Button
          onClick={handleClear}
          variant="outline"
          size="lg"
          disabled={selectedSlots.size === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </div>
    </div>
  );
}

export default DadDaysCalendar;
