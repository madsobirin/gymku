"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar, Loader2, ImageIcon, Search, X } from "lucide-react";
import { useWorkoutStorage, ApiWorkoutSession } from "@/hooks/useWorkoutStorage";
import { useEquipmentStorage } from "@/hooks/useEquipmentStorage";
import { Input } from "@/components/ui/input";

export function HistoryCalendar() {
  const { workouts, isLoaded } = useWorkoutStorage();
  const { equipment } = useEquipmentStorage();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();
  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // workouts from DB: date is ISO string "2026-05-24T00:00:00.000Z"
  const workoutDates = useMemo(() => {
    return new Set(workouts.map((w) => w.date.split("T")[0]));
  }, [workouts]);

  const selectedWorkouts: ApiWorkoutSession[] = workouts.filter((w) =>
    w.date.startsWith(selectedDate),
  );

  // History search state with debounce
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [debouncedHistoryQuery, setDebouncedHistoryQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedHistoryQuery(historySearchQuery);
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [historySearchQuery]);

  const filteredHistoryWorkouts = useMemo(() => {
    if (!debouncedHistoryQuery.trim()) return selectedWorkouts;
    const query = debouncedHistoryQuery.toLowerCase();
    return workouts.filter((workout) => {
      const matchesNotes = workout.notes?.toLowerCase().includes(query);
      const matchesEquipment = workout.workoutSets.some(
        (set) =>
          set.equipment.name.toLowerCase().includes(query) ||
          set.equipment.muscleGroup.toLowerCase().includes(query)
      );
      return matchesNotes || matchesEquipment;
    });
  }, [workouts, selectedWorkouts, debouncedHistoryQuery]);

  const getEquipmentName = (id: string) =>
    equipment.find((e) => e.id === id)?.name || "Unknown";

  // Build calendar grid
  const days: (string | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      i,
    );
    days.push(date.toISOString().split("T")[0]);
  }

  const handlePrevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  const handleNextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );

  // Group sets by equipment within a session
  const groupSetsByEquipment = (session: ApiWorkoutSession) => {
    const grouped = new Map<string, typeof session.workoutSets>();
    for (const set of session.workoutSets) {
      const existing = grouped.get(set.equipmentId) ?? [];
      grouped.set(set.equipmentId, [...existing, set]);
    }
    return Array.from(grouped.entries()).map(([equipmentId, sets]) => ({
      equipmentId,
      sets: sets.sort((a, b) => a.setNumber - b.setNumber),
    }));
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Workout History</h1>
        <p className="text-muted-foreground">Track your progress over time</p>
      </div>

      {/* Search Input for History */}
      <div className="space-y-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari aktivitas (cth: Squat, Dada) atau catatan..."
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
          {historySearchQuery && (
            <button
              onClick={() => setHistorySearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded text-muted-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {historySearchQuery !== debouncedHistoryQuery && (
          <p className="text-xs text-muted-foreground mt-1 ml-1 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
            Sedang mengetik...
          </p>
        )}
      </div>

      {/* Calendar */}
      <Card className="p-4 bg-card border-border space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-muted rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="text-lg font-semibold text-foreground min-w-[150px] text-center">
            {monthName}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-muted rounded transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {!isLoaded ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const hasWorkout = date && workoutDates.has(date);
              const isSelected = date === selectedDate;

              return (
                <button
                  key={index}
                  onClick={() => date && setSelectedDate(date)}
                  className={`aspect-square flex items-center justify-center rounded text-sm font-medium transition-colors relative ${
                    !date
                      ? "bg-transparent"
                      : isSelected
                        ? "bg-primary text-primary-foreground"
                        : hasWorkout
                          ? "bg-accent text-accent-foreground hover:opacity-80"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {date && date.split("-")[2]}
                  {hasWorkout && !isSelected && (
                    <div className="absolute bottom-1 w-1.5 h-1.5 bg-accent-foreground rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Workout Summary */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {debouncedHistoryQuery ? (
            <Search className="w-4 h-4 text-primary" />
          ) : (
            <Calendar className="w-4 h-4 text-muted-foreground" />
          )}
          <h3 className="text-sm font-semibold text-foreground">
            {debouncedHistoryQuery ? (
              `Hasil Pencarian: "${debouncedHistoryQuery}"`
            ) : (
              new Date(selectedDate + "T12:00:00").toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
              })
            )}
          </h3>
        </div>

        {!isLoaded ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredHistoryWorkouts.length === 0 ? (
          <Card className="p-8 text-center bg-card border-border">
            <p className="text-muted-foreground">
              {debouncedHistoryQuery
                ? "Aktivitas tidak ditemukan."
                : "Belum ada log latihan untuk tanggal ini."}
            </p>
          </Card>
        ) : (
          filteredHistoryWorkouts.map((workout) => {
            const exerciseGroups = groupSetsByEquipment(workout);
            const totalSets = workout.workoutSets.length;

            return (
              <Card
                key={workout.id}
                className="p-4 space-y-3 bg-card border-border"
              >
                <div className="text-xs text-muted-foreground flex justify-between items-center">
                  <span>
                    {debouncedHistoryQuery && (
                      <span className="font-semibold text-primary mr-2">
                        {new Date(workout.date).toLocaleDateString("id-ID", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </span>
                  <span>
                    {new Date(workout.createdAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="space-y-2">
                  {exerciseGroups.map(({ equipmentId, sets }) => (
                    <div key={equipmentId} className="space-y-2">
                      <h4 className="font-semibold text-foreground text-sm">
                        {getEquipmentName(equipmentId)}
                      </h4>
                      <div className="flex flex-col gap-2">
                        {sets.map((set) => (
                          <div
                            key={set.id}
                            className="text-xs bg-muted/40 rounded p-2 text-muted-foreground flex flex-col gap-2"
                          >
                            <div className="flex justify-between items-center">
                              <span>Set {set.setNumber}: <span className="text-foreground font-medium">{set.weight}kg × {set.reps}</span></span>
                              {set.imageUrl && <ImageIcon className="w-3 h-3 text-primary" />}
                            </div>
                            {set.imageUrl && (
                              <img src={set.imageUrl} alt={`Set ${set.setNumber} photo`} className="w-full h-24 object-cover rounded-md border border-border" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                  <p>
                    {exerciseGroups.length} exercise(s) · {totalSets} set(s)
                    {workout.notes && ` · ${workout.notes}`}
                  </p>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
