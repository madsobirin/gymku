'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkoutSession } from '@/types/workout';

const WORKOUTS_KEY = 'gym_workouts';

export function useWorkoutStorage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(WORKOUTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setWorkouts(Array.isArray(parsed) ? parsed : []);
      } else {
        setWorkouts([]);
      }
    } catch (error) {
      console.error('Failed to load workouts from localStorage:', error);
      setWorkouts([]);
    }
    setIsLoaded(true);
  }, []);

  const saveWorkouts = useCallback((newWorkouts: WorkoutSession[]) => {
    try {
      localStorage.setItem(WORKOUTS_KEY, JSON.stringify(newWorkouts));
      setWorkouts(newWorkouts);
    } catch (error) {
      console.error('Failed to save workouts to localStorage:', error);
    }
  }, []);

  const addWorkout = useCallback((workout: WorkoutSession) => {
    setWorkouts((prev) => {
      const updated = [...prev, workout];
      saveWorkouts(updated);
      return updated;
    });
  }, [saveWorkouts]);

  const updateWorkout = useCallback((id: string, workout: WorkoutSession) => {
    setWorkouts((prev) => {
      const updated = prev.map((w) => (w.id === id ? workout : w));
      saveWorkouts(updated);
      return updated;
    });
  }, [saveWorkouts]);

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      saveWorkouts(updated);
      return updated;
    });
  }, [saveWorkouts]);

  const getWorkoutsByDate = useCallback((date: string) => {
    return workouts.filter((w) => w.date === date);
  }, [workouts]);

  const clearAll = useCallback(() => {
    localStorage.removeItem(WORKOUTS_KEY);
    setWorkouts([]);
  }, []);

  return {
    workouts,
    isLoaded,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    getWorkoutsByDate,
    clearAll,
    saveWorkouts,
  };
}
