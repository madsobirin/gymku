import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  apiSuccess,
  apiCreated,
  apiError,
  apiUnauthorized,
  apiConflict,
  apiServerError,
} from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { createEquipmentSchema } from "@/lib/api/schemas";

// ─── GET /api/equipment ────────────────────────────────────────────────────────
// Query params: ?muscleGroup=Chest

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const muscleGroup = searchParams.get("muscleGroup");

    const equipment = await prisma.equipment.findMany({
      where: {
        userId,
        ...(muscleGroup ? { muscleGroup } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess(equipment);
  } catch (err) {
    return apiServerError(err);
  }
}

// ─── POST /api/equipment ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return apiUnauthorized();

    const validation = await validateBody(req, createEquipmentSchema);
    if (!validation.success) return validation.response;

    const { name, muscleGroup, imageUrl, notes } = validation.data;

    // Prevent duplicate name under same user
    const existing = await prisma.equipment.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" } },
    });
    if (existing) {
      return apiConflict(`Alat "${name}" sudah ada di daftar equipment Anda.`);
    }

    const equipment = await prisma.equipment.create({
      data: {
        name,
        muscleGroup,
        imageUrl: imageUrl ?? null,
        notes: notes ?? null,
        userId,
      },
    });

    return apiCreated(equipment, `Equipment "${name}" berhasil ditambahkan.`);
  } catch (err) {
    return apiServerError(err);
  }
}
