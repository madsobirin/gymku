import { z } from "zod";

// ─── Equipment ─────────────────────────────────────────────────────────────────

export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Cardio",
  "Core",
  "Full Body",
] as const;

export const createEquipmentSchema = z.object({
  name: z
    .string({ required_error: "Nama alat wajib diisi." })
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter.")
    .trim(),
  muscleGroup: z.enum(MUSCLE_GROUPS, {
    errorMap: () => ({ message: `Muscle group harus salah satu dari: ${MUSCLE_GROUPS.join(", ")}.` }),
  }),
  imageUrl: z.string().url("imageUrl harus berupa URL yang valid.").optional().nullable(),
  notes: z.string().max(500, "Catatan maksimal 500 karakter.").optional().nullable(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;

// ─── Workout Sets (nested) ─────────────────────────────────────────────────────

export const workoutSetSchema = z.object({
  setNumber: z.number({ required_error: "setNumber wajib diisi." }).int().positive(),
  weight: z
    .number({ required_error: "weight wajib diisi." })
    .min(0, "Berat tidak boleh negatif.")
    .max(1000, "Berat terlalu besar."),
  reps: z
    .number({ required_error: "reps wajib diisi." })
    .int()
    .positive("Reps minimal 1."),
  imageUrl: z.string().url("imageUrl harus berupa URL yang valid.").optional().nullable(),
});

export const updateWorkoutSetSchema = z.object({
  weight: z.number().min(0).max(1000).optional(),
  reps: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional().nullable(),
});

// ─── Workout Session ───────────────────────────────────────────────────────────

/**
 * Each exercise groups sets by equipment.
 * The UI sends: { equipmentId, sets: [{ setNumber, weight, reps }] }
 */
export const exerciseInputSchema = z.object({
  equipmentId: z.string({ required_error: "equipmentId wajib diisi." }).uuid("equipmentId harus UUID."),
  sets: z
    .array(workoutSetSchema)
    .min(1, "Minimal satu set per latihan."),
});

export const createWorkoutSchema = z.object({
  date: z
    .string({ required_error: "Tanggal wajib diisi." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."),
  notes: z.string().max(1000).optional().nullable(),
  exercises: z
    .array(exerciseInputSchema)
    .min(1, "Minimal satu latihan per sesi."),
});

export const updateWorkoutSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD.")
    .optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export type WorkoutSetInput = z.infer<typeof workoutSetSchema>;
export type UpdateWorkoutSetInput = z.infer<typeof updateWorkoutSetSchema>;
export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
