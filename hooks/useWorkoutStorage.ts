"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// ─── Types mirroring the DB + API shape ────────────────────────────────────────

export interface ApiWorkoutSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  equipmentId: string;
  sessionId: string;
  createdAt: string;
  equipment: {
    id: string;
    name: string;
    muscleGroup: string;
  };
}

export interface ApiWorkoutSession {
  id: string;
  date: string;       // ISO string from DB
  notes: string | null;
  createdAt: string;
  userId: string;
  workoutSets: ApiWorkoutSet[];
}

// ─── Input type for saving a new workout ──────────────────────────────────────

export interface SaveWorkoutInput {
  date: string; // YYYY-MM-DD
  notes?: string | null;
  exercises: {
    equipmentId: string;
    sets: { setNumber: number; weight: number; reps: number }[];
  }[];
}

export function useWorkoutStorage() {
  const [workouts, setWorkouts] = useState<ApiWorkoutSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // ─── Fetch all workouts ──────────────────────────────────────────────────────
  const fetchWorkouts = useCallback(async (date?: string) => {
    try {
      const url = date ? `/api/workouts?date=${date}` : "/api/workouts";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal memuat workout");
      const json = await res.json();
      if (!date) {
        setWorkouts(json.data ?? []);
      }
      return json.data as ApiWorkoutSession[];
    } catch (err) {
      console.error("[useWorkoutStorage] fetch error:", err);
      toast.error("Gagal memuat riwayat workout.");
      return [];
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  // ─── Save a workout session ────────────────────────────────────────────────
  const addWorkout = useCallback(async (input: SaveWorkoutInput) => {
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal menyimpan workout.");
        return null;
      }
      const saved = json.data as ApiWorkoutSession;
      setWorkouts((prev) => [saved, ...prev]);
      toast.success(json.message ?? "Workout berhasil disimpan! 💪");
      return saved;
    } catch (err) {
      console.error("[useWorkoutStorage] addWorkout error:", err);
      toast.error("Terjadi kesalahan jaringan.");
      return null;
    }
  }, []);

  // ─── Delete a workout session ──────────────────────────────────────────────
  const deleteWorkout = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal menghapus workout.");
        return false;
      }
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      toast.success(json.message ?? "Workout berhasil dihapus.");
      return true;
    } catch (err) {
      console.error("[useWorkoutStorage] deleteWorkout error:", err);
      toast.error("Terjadi kesalahan jaringan.");
      return false;
    }
  }, []);

  // ─── Update a workout session ──────────────────────────────────────────────
  const updateWorkout = useCallback(
    async (id: string, data: { date?: string; notes?: string | null }) => {
      try {
        const res = await fetch(`/api/workouts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? "Gagal memperbarui workout.");
          return null;
        }
        const updated = json.data as ApiWorkoutSession;
        setWorkouts((prev) => prev.map((w) => (w.id === id ? updated : w)));
        return updated;
      } catch (err) {
        console.error("[useWorkoutStorage] updateWorkout error:", err);
        toast.error("Terjadi kesalahan jaringan.");
        return null;
      }
    },
    [],
  );

  // ─── Get workouts for a specific date (YYYY-MM-DD) ────────────────────────
  const getWorkoutsByDate = useCallback(
    (date: string) => {
      // Date from DB is an ISO string like "2026-05-24T00:00:00.000Z"
      // We match just the YYYY-MM-DD part
      return workouts.filter((w) => w.date.startsWith(date));
    },
    [workouts],
  );

  return {
    workouts,
    isLoaded,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    getWorkoutsByDate,
    refresh: fetchWorkouts,
  };
}
