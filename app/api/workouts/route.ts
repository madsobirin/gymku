import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  apiSuccess,
  apiCreated,
  apiError,
  apiUnauthorized,
  apiServerError,
} from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { createWorkoutSchema } from "@/lib/api/schemas";

// ─── GET /api/workouts ─────────────────────────────────────────────────────────
// Query params: ?date=YYYY-MM-DD

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    // Build date filter
    let dateFilter: { gte: Date; lt: Date } | undefined;
    if (dateParam) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return apiError("Format tanggal harus YYYY-MM-DD.", 400);
      }
      const start = new Date(`${dateParam}T00:00:00.000Z`);
      const end = new Date(`${dateParam}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      dateFilter = { gte: start, lt: end };
    }

    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: {
        workoutSets: {
          include: { equipment: { select: { id: true, name: true, muscleGroup: true } } },
          orderBy: [{ equipmentId: "asc" }, { setNumber: "asc" }],
        },
      },
      orderBy: { date: "desc" },
    });

    return apiSuccess(sessions);
  } catch (err) {
    return apiServerError(err);
  }
}

// ─── POST /api/workouts ────────────────────────────────────────────────────────
// Body: { date, notes?, exercises: [{ equipmentId, sets: [{ setNumber, weight, reps }] }] }

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return apiUnauthorized();

    const validation = await validateBody(req, createWorkoutSchema);
    if (!validation.success) return validation.response;

    const { date, notes, exercises } = validation.data;

    // Validate all equipmentIds belong to this user
    const equipmentIds = exercises.map((e) => e.equipmentId);
    const ownedEquipment = await prisma.equipment.findMany({
      where: { id: { in: equipmentIds }, userId },
      select: { id: true },
    });
    const ownedIds = new Set(ownedEquipment.map((e) => e.id));
    const invalidIds = equipmentIds.filter((id) => !ownedIds.has(id));
    if (invalidIds.length > 0) {
      return apiError(`Equipment ID berikut tidak valid atau bukan milik Anda: ${invalidIds.join(", ")}`, 400);
    }

    // Create session + all sets in a single transaction
    const session = await prisma.$transaction(async (tx) => {
      const workoutSession = await tx.workoutSession.create({
        data: {
          date: new Date(`${date}T00:00:00.000Z`),
          notes: notes ?? null,
          userId,
        },
      });

      // Flatten exercises → individual WorkoutSet rows
      const setRows = exercises.flatMap((exercise) =>
        exercise.sets.map((set) => ({
          sessionId: workoutSession.id,
          equipmentId: exercise.equipmentId,
          setNumber: set.setNumber,
          weight: set.weight,
          reps: set.reps,
        })),
      );

      await tx.workoutSet.createMany({ data: setRows });

      return tx.workoutSession.findUnique({
        where: { id: workoutSession.id },
        include: {
          workoutSets: {
            include: {
              equipment: { select: { id: true, name: true, muscleGroup: true } },
            },
            orderBy: [{ equipmentId: "asc" }, { setNumber: "asc" }],
          },
        },
      });
    });

    return apiCreated(session, "Sesi workout berhasil disimpan.");
  } catch (err) {
    return apiServerError(err);
  }
}
