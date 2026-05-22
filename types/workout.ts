export interface Equipment {
  id: string;
  name: string;
  muscleGroup: string;
  photoBase64?: string;
  createdAt: number;
}

export interface ExerciseSet {
  weight: number; // in kg
  reps: number;
  notes?: string;
}

export interface Exercise {
  equipmentId: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD format
  exercises: Exercise[];
  duration?: number; // in minutes
  notes?: string;
  completedAt: number; // timestamp
}

export interface CurrentSession {
  exercises: Exercise[];
  startedAt: number;
}

export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Cardio' | 'Core' | 'Full Body';
