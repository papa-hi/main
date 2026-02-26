import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Types
interface TimeSlot {
  dayOfWeek: number;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'allday';
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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  { key: 'morning', label: 'Morning', emoji: '🌅', time: '7am-12pm' },
  { key: 'afternoon', label: 'Afternoon', emoji: '☀️', time: '12pm-5pm' },
  { key: 'evening', label: 'Evening', emoji: '🌆', time: '5pm-8pm' },
];

export function DadDaysCalendar() {
  const queryClient = useQueryClient();
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState<{day: number, slot: string} | null>(null);

  // Fetch current availability
  const { data: availabilityData, isLoading } = useQuery({
    queryKey: ['availability'],
    queryFn: async () => {
      const res = await fetch('/api/availability');
      if (!res.ok) throw new Error('Failed to fetch availability');
      return res.json();
    },
  });

  // Initialize selected slots from existing data
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

  // Save availability mutation
  const saveAvailability = useMutation({
    mutationFn: async (availability: TimeSlot[]) => {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability }),
      });
      if (!res.ok) throw new Error('Failed to save availability');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['availabilityMatches'] });
      alert(data.message);
    },
  });

  // Toggle slot mutation
  const toggleSlot = useMutation({
    mutationFn: async ({ day, slot }: { day: number; slot: string }) => {
      const res = await fetch('/api/availability/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek: day, timeSlot: slot }),
      });
      if (!res.ok) throw new Error('Failed to toggle slot');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['availabilityMatches'] });
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
    
    // Optimistically update UI and send to server
    toggleSlot.mutate({ day: dayOfWeek, slot: timeSlot });
  };

  const handleSave = () => {
    const availability: TimeSlot[] = Array.from(selectedSlots).map(key => {
      const [day, slot] = key.split('-');
      return {
        dayOfWeek: parseInt(day),
        timeSlot: slot as 'morning' | 'afternoon' | 'evening' | 'allday',
      };
    });
    
    saveAvailability.mutate(availability);
  };

  const isSlotSelected = (day: number, slot: string) => {
    return selectedSlots.has(`${day}-${slot}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading your Dad Days...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          📅 Your Dad Days Calendar
        </h1>
        <p className="text-gray-600">
          Mark when you're usually free for playdates. We'll match you with dads who share your schedule!
        </p>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Time
                </th>
                {DAYS.map((day, index) => (
                  <th key={index} className="px-2 py-3 text-center text-sm font-semibold text-gray-700">
                    <div>{day}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {TIME_SLOTS.map((timeSlot) => (
                <tr key={timeSlot.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{timeSlot.emoji}</span>
                      <div>
                        <div className="font-medium text-gray-900">{timeSlot.label}</div>
                        <div className="text-xs text-gray-500">{timeSlot.time}</div>
                      </div>
                    </div>
                  </td>
                  {DAYS.map((_, dayIndex) => (
                    <td key={dayIndex} className="px-2 py-3 text-center">
                      <button
                        onClick={() => handleSlotClick(dayIndex, timeSlot.key)}
                        onMouseEnter={() => setShowStats({ day: dayIndex, slot: timeSlot.key })}
                        onMouseLeave={() => setShowStats(null)}
                        className={`w-12 h-12 rounded-lg border-2 transition-all relative ${
                          isSlotSelected(dayIndex, timeSlot.key)
                            ? 'bg-blue-500 border-blue-600 text-white shadow-md scale-105'
                            : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        {isSlotSelected(dayIndex, timeSlot.key) && (
                          <span className="text-2xl">✓</span>
                        )}
                        
                        {/* Hover tooltip showing match count */}
                        {showStats?.day === dayIndex && showStats?.slot === timeSlot.key && (
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
      </div>

      {/* Selected Summary */}
      {selectedSlots.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                ✅ You've selected {selectedSlots.size} time slot{selectedSlots.size !== 1 ? 's' : ''}
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedSlots).map(key => {
                  const [day, slot] = key.split('-');
                  const timeSlotInfo = TIME_SLOTS.find(ts => ts.key === slot);
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-blue-300"
                    >
                      {timeSlotInfo?.emoji} {FULL_DAYS[parseInt(day)]} {timeSlotInfo?.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matches Preview */}
      <MatchesPreview />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saveAvailability.isPending}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saveAvailability.isPending ? 'Saving...' : 'Save Dad Days'}
        </button>
        <button
          onClick={() => setSelectedSlots(new Set())}
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}

// Slot statistics tooltip component
function SlotStats({ day, slot }: { day: number; slot: string }) {
  const { data } = useQuery({
    queryKey: ['slotStats', day, slot],
    queryFn: async () => {
      const res = await fetch(`/api/availability/stats/slot?day=${day}&slot=${slot}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000, // Cache for 1 minute
  });

  if (!data) return null;

  return (
    <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg">
      <div className="font-semibold mb-1">{data.dayName} {data.timeSlotDisplay}</div>
      <div className="space-y-1">
        <div>👥 {data.availableDadsCount} dads nearby</div>
        {data.newThisWeek > 0 && (
          <div>🆕 {data.newThisWeek} joined this week</div>
        )}
        <div className="text-gray-300">{data.message}</div>
      </div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  );
}

// Matches preview component
function MatchesPreview() {
  const { data } = useQuery({
    queryKey: ['availabilityMatches'],
    queryFn: async () => {
      const res = await fetch('/api/availability/matches');
      if (!res.ok) return null;
      return res.json();
    },
  });

  if (!data || data.totalMatches === 0) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-green-900 mb-2">
        🎯 {data.totalMatches} dad{data.totalMatches !== 1 ? 's' : ''} match your schedule!
      </h3>
      <p className="text-green-700 text-sm mb-3">
        These dads are free at the same times as you. Start connecting!
      </p>
      <a
        href="/matches"
        className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
      >
        View All Matches →
      </a>
    </div>
  );
}

export default DadDaysCalendar;
