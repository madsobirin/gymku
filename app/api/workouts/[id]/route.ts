import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiForbidden,
  apiServerError,
} from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { updateWorkoutSchema } from "@/lib/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

// ─── Helper: get session & enforce ownership ───────────────────────────────────

async function getOwnedSession(id: string, userId: string) {
  const session = await prisma.workoutSession.findUnique({
    where: { id },
    include: {
      workoutSets: {
        include: {
          equipment: { select: { id: true, name: true, muscleGroup: true } },
        },
        orderBy: [{ equipmentId: "asc" }, { setNumber: "asc" }],
      },
    },
  });
  if (!session) return { session: null, error: apiNotFound("Workout session") };
  if (session.userId !== userId) return { session: null, error: apiForbidden() };
  return { session, error: null };
}

// ─── GET /api/workouts/[id] ────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return apiUnauthorized();

    const { id } = await params;
    const { session, error } = await getOwnedSession(id, userId);
    if (error) return error;

    return apiSuccess(session);
  } catch (err) {
    return apiServerError(err);
  }
}

// ─── PATCH /api/workouts/[id] ──────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return apiUnauthorized();

    const { id } = await params;
    const { session, error } = await getOwnedSession(id, userId);
    if (error) return error;

    const validation = await validateBody(req, updateWorkoutSchema);
    if (!validation.success) return validation.response;

    const { date, notes } = validation.data;

    const updated = await prisma.workoutSession.update({
      where: { id: session!.id },
      data: {
        ...(date !== undefined && { date: new Date(`${date}T00:00:00.000Z`) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        workoutSets: {
          include: {
            equipment: { select: { id: true, name: true, muscleGroup: true } },
          },
          orderBy: [{ equipmentId: "asc" }, { setNumber: "asc" }],
        },
      },
    });

    return apiSuccess(updated, "Sesi workout berhasil diperbarui.");
  } catch (err) {
    return apiServerError(err);
  }
}

// ─── DELETE /api/workouts/[id] ─────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return apiUnauthorized();

    const { id } = await params;
    const { session, error } = await getOwnedSession(id, userId);
    if (error) return error;

    await prisma.workoutSession.delete({ where: { id: session!.id } });

    return apiSuccess(
      { id: session!.id },
      `Sesi workout tanggal ${new Date(session!.date).toLocaleDateString("id-ID")} berhasil dihapus.`,
    );
  } catch (err) {
    return apiServerError(err);
  }
}
