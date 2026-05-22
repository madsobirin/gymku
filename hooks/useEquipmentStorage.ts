"use client";

import { useState, useEffect, useCallback } from "react";
import { Equipment } from "@/types/workout";

const EQUIPMENT_KEY = "gym_equipment";

// Default equipment to seed the app with
const DEFAULT_EQUIPMENT: Equipment[] = [
  {
    id: "barbell-bench",
    name: "Barbell Bench Press",
    muscleGroup: "Chest",
    createdAt: Date.now(),
  },
  {
    id: "dumbbell",
    name: "Dumbbell",
    muscleGroup: "Arms",
    createdAt: Date.now(),
  },
  {
    id: "squat-rack",
    name: "Squat Rack",
    muscleGroup: "Legs",
    createdAt: Date.now(),
  },
  {
    id: "pull-up-bar",
    name: "Pull-up Bar",
    muscleGroup: "Back",
    createdAt: Date.now(),
  },
  {
    id: "rowing-machine",
    name: "Rowing Machine",
    muscleGroup: "Back",
    createdAt: Date.now(),
  },
  {
    id: "treadmill",
    name: "Treadmill",
    muscleGroup: "Cardio",
    createdAt: Date.now(),
  },
];

export function useEquipmentStorage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(EQUIPMENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const seenIds = new Set<string>();
          const sanitized: Equipment[] = [];
          let hasChanges = false;

          for (const eq of parsed) {
            let currentEq = { ...eq };
            if (!currentEq.id) {
              currentEq.id = `equipment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
              hasChanges = true;
            }

            if (seenIds.has(currentEq.id)) {
              hasChanges = true;
              // If it's an exact duplicate of name and muscleGroup, we skip it
              const isExactDuplicate = sanitized.some(
                (e) =>
                  e.id === currentEq.id &&
                  e.name === currentEq.name &&
                  e.muscleGroup === currentEq.muscleGroup,
              );
              if (isExactDuplicate) {
                continue;
              } else {
                // Different item with duplicate ID, generate a new unique ID
                currentEq.id = `equipment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                sanitized.push(currentEq);
                seenIds.add(currentEq.id);
              }
            } else {
              sanitized.push(currentEq);
              seenIds.add(currentEq.id);
            }
          }

          if (hasChanges) {
            localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(sanitized));
          }
          setEquipment(sanitized);
        } else {
          setEquipment(DEFAULT_EQUIPMENT);
        }
      } else {
        // Seed with default equipment on first load
        localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(DEFAULT_EQUIPMENT));
        setEquipment(DEFAULT_EQUIPMENT);
      }
    } catch (error) {
      console.error("Failed to load equipment from localStorage:", error);
      setEquipment(DEFAULT_EQUIPMENT);
    }
    setIsLoaded(true);
  }, []);

  const saveEquipment = useCallback((newEquipment: Equipment[]) => {
    try {
      localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(newEquipment));
      setEquipment(newEquipment);
    } catch (error) {
      console.error("Failed to save equipment to localStorage:", error);
    }
  }, []);

  const addEquipment = useCallback(
    (eq: Equipment) => {
      setEquipment((prev) => {
        const updated = [...prev, eq];
        saveEquipment(updated);
        return updated;
      });
    },
    [saveEquipment],
  );

  const updateEquipment = useCallback(
    (id: string, eq: Equipment) => {
      setEquipment((prev) => {
        const updated = prev.map((e) => (e.id === id ? eq : e));
        saveEquipment(updated);
        return updated;
      });
    },
    [saveEquipment],
  );

  const deleteEquipment = useCallback(
    (id: string) => {
      setEquipment((prev) => {
        const updated = prev.filter((e) => e.id !== id);
        saveEquipment(updated);
        return updated;
      });
    },
    [saveEquipment],
  );

  const getByMuscleGroup = useCallback(
    (muscleGroup: string) => {
      return equipment.filter((e) => e.muscleGroup === muscleGroup);
    },
    [equipment],
  );

  const getById = useCallback(
    (id: string) => {
      return equipment.find((e) => e.id === id);
    },
    [equipment],
  );

  const clearAll = useCallback(() => {
    localStorage.removeItem(EQUIPMENT_KEY);
    setEquipment([]);
  }, []);

  return {
    equipment,
    isLoaded,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    getByMuscleGroup,
    getById,
    clearAll,
    saveEquipment,
  };
}
