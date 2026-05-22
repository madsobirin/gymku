'use client';

import { useState, useCallback } from 'react';
import { CurrentSession, Exercise } from '@/types/workout';

export function useSessionManager() {
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);

  const startSession = useCallback(() => {
    setCurrentSession({
      exercises: [],
      startedAt: Date.now(),
    });
  }, []);

  const addExercise = useCallback((exercise: Exercise) => {
    setCurrentSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: [...prev.exercises, exercise],
      };
    });
  }, []);

  const updateExercise = useCallback((index: number, exercise: Exercise) => {
    setCurrentSession((prev) => {
      if (!prev) return null;
      const updated = [...prev.exercises];
      updated[index] = exercise;
      return {
        ...prev,
        exercises: updated,
      };
    });
  }, []);

  const removeExercise = useCallback((index: number) => {
    setCurrentSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.filter((_, i) => i !== index),
      };
    });
  }, []);

  const addSet = useCallback((exerciseIndex: number, weight: number, reps: number, notes?: string) => {
    setCurrentSession((prev) => {
      if (!prev) return null;
      const updated = [...prev.exercises];
      updated[exerciseIndex].sets.push({
        weight,
        reps,
        notes,
      });
      return {
        ...prev,
        exercises: updated,
      };
    });
  }, []);

  const updateSet = useCallback(
    (exerciseIndex: number, setIndex: number, weight: number, reps: number, notes?: string) => {
      setCurrentSession((prev) => {
        if (!prev) return null;
        const updated = [...prev.exercises];
        updated[exerciseIndex].sets[setIndex] = {
          weight,
          reps,
          notes,
        };
        return {
          ...prev,
          exercises: updated,
        };
      });
    },
    []
  );

  const removeSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setCurrentSession((prev) => {
      if (!prev) return null;
      const updated = [...prev.exercises];
      updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex);
      return {
        ...prev,
        exercises: updated,
      };
    });
  }, []);

  const endSession = useCallback(() => {
    const session = currentSession;
    setCurrentSession(null);
    return session;
  }, [currentSession]);

  const clearSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  return {
    currentSession,
    startSession,
    addExercise,
    updateExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    endSession,
    clearSession,
  };
}
