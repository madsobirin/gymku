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
import { updateWorkoutSetSchema } from "@/lib/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedSet(id: string, userId: string) {
  const set = await prisma.workoutSet.findUnique({
    where: { id },
    include: { session: true },
  });
  if (!set) return { set: null, error: apiNotFound("Workout set") };
  if (set.session.userId !== userId) return { set: null, error: apiForbidden() };
  return { set, error: null };
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return apiUnauthorized();

    const { id } = await params;
    const { set, error } = await getOwnedSet(id, userId);
    if (error) return error;

    const validation = await validateBody(req, updateWorkoutSetSchema);
    if (!validation.success) return validation.response;

    const { weight, reps, imageUrl } = validation.data;

    const updated = await prisma.workoutSet.update({
      where: { id: set!.id },
      data: {
        ...(weight !== undefined && { weight }),
        ...(reps !== undefined && { reps }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    return apiSuccess(updated, "Set latihan berhasil diperbarui.");
  } catch (err) {
    return apiServerError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return apiUnauthorized();

    const { id } = await params;
    const { set, error } = await getOwnedSet(id, userId);
    if (error) return error;

    await prisma.workoutSet.delete({ where: { id: set!.id } });

    return apiSuccess({ id: set!.id }, "Set latihan berhasil dihapus.");
  } catch (err) {
    return apiServerError(err);
  }
}
