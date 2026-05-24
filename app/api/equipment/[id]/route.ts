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
import { updateEquipmentSchema } from "@/lib/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

// ─── Helper: get equipment & enforce ownership ─────────────────────────────────

async function getOwnedEquipment(id: string, userId: string) {
  const equipment = await prisma.equipment.findUnique({ where: { id } });
  if (!equipment) return { equipment: null, error: apiNotFound("Equipment") };
  if (equipment.userId !== userId) return { equipment: null, error: apiForbidden() };
  return { equipment, error: null };
}

// ─── GET /api/equipment/[id] ───────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return apiUnauthorized();

    const { id } = await params;
    const { equipment, error } = await getOwnedEquipment(id, userId);
    if (error) return error;

    return apiSuccess(equipment);
  } catch (err) {
    return apiServerError(err);
  }
}

// ─── PATCH /api/equipment/[id] ─────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return apiUnauthorized();

    const { id } = await params;
    const { equipment, error } = await getOwnedEquipment(id, userId);
    if (error) return error;

    const validation = await validateBody(req, updateEquipmentSchema);
    if (!validation.success) return validation.response;

    const updated = await prisma.equipment.update({
      where: { id: equipment!.id },
      data: {
        ...(validation.data.name !== undefined && { name: validation.data.name }),
        ...(validation.data.muscleGroup !== undefined && { muscleGroup: validation.data.muscleGroup }),
        ...(validation.data.imageUrl !== undefined && { imageUrl: validation.data.imageUrl }),
      },
    });

    return apiSuccess(updated, "Equipment berhasil diperbarui.");
  } catch (err) {
    return apiServerError(err);
  }
}

// ─── DELETE /api/equipment/[id] ────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return apiUnauthorized();

    const { id } = await params;
    const { equipment, error } = await getOwnedEquipment(id, userId);
    if (error) return error;

    await prisma.equipment.delete({ where: { id: equipment!.id } });

    return apiSuccess({ id: equipment!.id }, `Equipment "${equipment!.name}" berhasil dihapus.`);
  } catch (err) {
    return apiServerError(err);
  }
}
