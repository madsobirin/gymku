"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { useEquipmentStorage } from "@/hooks/useEquipmentStorage";
import { useSessionManager } from "@/hooks/useSessionManager";
import { useWorkoutStorage } from "@/hooks/useWorkoutStorage";
import { Equipment, Exercise, WorkoutSession } from "@/types/workout";

interface DashboardProps {
  onEquipmentModalOpen: () => void;
}

export function Dashboard({ onEquipmentModalOpen }: DashboardProps) {
  const { equipment } = useEquipmentStorage();
  const {
    currentSession,
    startSession,
    addExercise,
    addSet,
    removeSet,
    removeExercise,
    endSession,
  } = useSessionManager();
  const { addWorkout, getWorkoutsByDate } = useWorkoutStorage();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null,
  );
  const [weight, setWeight] = useState(20);
  const [reps, setReps] = useState(10);
  const [showSearch, setShowSearch] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(
    new Set(),
  );

  const today = new Date().toISOString().split("T")[0];
  const todaysWorkouts = getWorkoutsByDate(today);

  const filteredEquipment = useMemo(() => {
    if (!searchQuery) return equipment;
    return equipment.filter(
      (e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [equipment, searchQuery]);

  const handleSelectEquipment = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setSearchQuery("");
    setShowSearch(false);
  };

  const handleAddSet = () => {
    if (!selectedEquipment || !currentSession) return;

    const existingExercise = currentSession.exercises.findIndex(
      (e) => e.equipmentId === selectedEquipment.id,
    );

    if (existingExercise !== -1) {
      addSet(existingExercise, weight, reps);
    } else {
      const newExercise: Exercise = {
        equipmentId: selectedEquipment.id,
        sets: [{ weight, reps }],
      };
      addExercise(newExercise);
    }

    // Reset inputs
    setWeight(20);
    setReps(10);
  };

  const handleCompleteWorkout = () => {
    if (!currentSession) return;

    const session = endSession();
    if (session && session.exercises.length > 0) {
      const workoutSession: WorkoutSession = {
        id: `workout_${Date.now()}`,
        date: today,
        exercises: session.exercises,
        completedAt: Date.now(),
      };
      addWorkout(workoutSession);
    }
  };

  const getPreviousSession = (equipmentId: string) => {
    for (let i = todaysWorkouts.length - 1; i >= 0; i--) {
      const exercise = todaysWorkouts[i].exercises.find(
        (e) => e.equipmentId === equipmentId,
      );
      if (exercise) {
        const lastSet = exercise.sets[exercise.sets.length - 1];
        return lastSet;
      }
    }
    return null;
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedExercises(newExpanded);
  };

  const getEquipmentName = (equipmentId: string) => {
    return equipment.find((e) => e.id === equipmentId)?.name || "Unknown";
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Today&apos;s Workout
        </h1>
        <p className="text-muted-foreground">
          {new Date(today).toLocaleDateString()}
        </p>
      </div>

      {/* Start/Complete Session Buttons */}
      {!currentSession ? (
        <Button
          onClick={startSession}
          size="lg"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg h-12"
        >
          Start Today&apos;s Workout
        </Button>
      ) : (
        <Button
          onClick={handleCompleteWorkout}
          disabled={!currentSession.exercises.length}
          size="lg"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg h-12"
        >
          Complete Workout
        </Button>
      )}

      {currentSession && (
        <>
          {/* Equipment Search */}
          <div className="relative">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearch(true);
                  }}
                  onFocus={() => setShowSearch(true)}
                  className="pl-10 bg-card border-border"
                />
              </div>
              {selectedEquipment && (
                <button
                  onClick={() => {
                    setSelectedEquipment(null);
                    setSearchQuery("");
                  }}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {showSearch && filteredEquipment.length > 0 && (
              <Card className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto z-50 bg-card border-border">
                {filteredEquipment.map((eq) => (
                  <button
                    key={eq.id}
                    onClick={() => handleSelectEquipment(eq)}
                    className="w-full p-3 hover:bg-muted text-left transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="font-medium text-foreground">{eq.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {eq.muscleGroup}
                    </div>
                  </button>
                ))}
              </Card>
            )}
          </div>

          {/* Selected Equipment Display */}
          {selectedEquipment && (
            <div className="p-3 bg-muted rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">
                Selected Equipment
              </p>
              <p className="font-semibold text-foreground">
                {selectedEquipment.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedEquipment.muscleGroup}
              </p>
            </div>
          )}

          {/* Input Section */}
          {selectedEquipment && (
            <Card className="p-4 space-y-4 bg-card border-border">
              {/* Weight Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Weight (kg)
                </label>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWeight(Math.max(0, weight - 2.5))}
                    className="bg-muted hover:bg-muted/80 border-border"
                  >
                    −2.5
                  </Button>
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) =>
                      setWeight(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="text-center bg-card border-border"
                    step={0.5}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWeight(weight + 2.5)}
                    className="bg-muted hover:bg-muted/80 border-border"
                  >
                    +2.5
                  </Button>
                </div>
              </div>

              {/* Reps Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Reps
                </label>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReps(Math.max(1, reps - 1))}
                    className="bg-muted hover:bg-muted/80 border-border"
                  >
                    −1
                  </Button>
                  <Input
                    type="number"
                    value={reps}
                    onChange={(e) =>
                      setReps(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="text-center bg-card border-border"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReps(reps + 1)}
                    className="bg-muted hover:bg-muted/80 border-border"
                  >
                    +1
                  </Button>
                </div>
              </div>

              {/* Previous Session Display */}
              {getPreviousSession(selectedEquipment.id) && (
                <div className="p-2 bg-muted/40 rounded border border-border text-sm">
                  <p className="text-muted-foreground">
                    Previous:{" "}
                    <span className="font-semibold">
                      {getPreviousSession(selectedEquipment.id)?.weight}kg ×{" "}
                      {getPreviousSession(selectedEquipment.id)?.reps}
                    </span>
                  </p>
                </div>
              )}

              {/* Add Set Button */}
              <Button
                onClick={handleAddSet}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Set
              </Button>
            </Card>
          )}

          {/* Current Session Exercises */}
          {currentSession.exercises.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Today&apos;s Sets
              </h3>
              {currentSession.exercises.map((exercise, exerciseIndex) => (
                <Card
                  key={exerciseIndex}
                  className="p-3 space-y-2 bg-card border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">
                        {getEquipmentName(exercise.equipmentId)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {exercise.sets.length} set(s)
                      </p>
                    </div>
                    <button
                      onClick={() => removeExercise(exerciseIndex)}
                      className="p-1.5 hover:bg-muted rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {expandedExercises.has(exerciseIndex) && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      {exercise.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className="flex items-center justify-between p-2 bg-muted/40 rounded text-sm"
                        >
                          <span className="text-foreground">
                            Set {setIndex + 1}: {set.weight}kg × {set.reps}
                          </span>
                          <button
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                          >
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {exercise.sets.length > 0 && (
                    <button
                      onClick={() => toggleExpanded(exerciseIndex)}
                      className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>View details</span>
                      {expandedExercises.has(exerciseIndex) ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!currentSession && (
        <Card className="p-8 text-center space-y-3 bg-card border-border">
          <p className="text-muted-foreground">
            Start your workout to begin logging exercises
          </p>
        </Card>
      )}
    </div>
  );
}
