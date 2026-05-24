import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  apiSuccess,
  apiUnauthorized,
  apiServerError,
} from "@/lib/api/response";

export async function GET(_req: NextRequest) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return apiUnauthorized();

    // ─── 1. Total sessions & total sets ─────────────────────────────────────
    const [totalSessions, totalSets] = await Promise.all([
      prisma.workoutSession.count({ where: { userId } }),
      prisma.workoutSet.count({
        where: { session: { userId } },
      }),
    ]);

    // ─── 2. Total volume (SUM of weight * reps) ──────────────────────────────
    const volumeResult = await prisma.workoutSet.aggregate({
      where: { session: { userId } },
      _sum: { weight: true, reps: true },
    });

    // Approximate total volume: sum each set's weight × reps
    // (We need per-row multiplication — done via raw aggregation below)
    const setsForVolume = await prisma.workoutSet.findMany({
      where: { session: { userId } },
      select: { weight: true, reps: true },
    });
    const totalVolume = setsForVolume.reduce(
      (acc, s) => acc + s.weight * s.reps,
      0,
    );

    // ─── 3. This week sessions ────────────────────────────────────────────────
    const now = new Date();
    // Start of current ISO week (Monday)
    const dayOfWeek = now.getUTCDay(); // 0 = Sun
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + diff);
    weekStart.setUTCHours(0, 0, 0, 0);

    const thisWeekSessions = await prisma.workoutSession.count({
      where: { userId, date: { gte: weekStart } },
    });

    // ─── 4. Personal Records (heaviest weight per equipment) ─────────────────
    const prResult = await prisma.workoutSet.groupBy({
      by: ["equipmentId"],
      where: { session: { userId } },
      _max: { weight: true },
      orderBy: { _max: { weight: "desc" } },
    });

    // Enrich PRs with equipment details
    const prEquipmentIds = prResult.map((r) => r.equipmentId);
    const prEquipment = await prisma.equipment.findMany({
      where: { id: { in: prEquipmentIds }, userId },
      select: { id: true, name: true, muscleGroup: true },
    });
    const equipmentMap = new Map(prEquipment.map((e) => [e.id, e]));

    const personalRecords = prResult.map((r) => ({
      equipment: equipmentMap.get(r.equipmentId) ?? {
        id: r.equipmentId,
        name: "Unknown",
        muscleGroup: "",
      },
      maxWeight: r._max.weight ?? 0,
    }));

    // ─── 5. Muscle group breakdown (total sets per group) ────────────────────
    const muscleGroupSets = await prisma.workoutSet.findMany({
      where: { session: { userId } },
      select: {
        equipment: { select: { muscleGroup: true } },
      },
    });

    const muscleGroupBreakdown = muscleGroupSets.reduce<Record<string, number>>(
      (acc, s) => {
        const group = s.equipment.muscleGroup;
        acc[group] = (acc[group] ?? 0) + 1;
        return acc;
      },
      {},
    );

    // Sort by count desc
    const sortedMuscleGroups = Object.entries(muscleGroupBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([muscleGroup, sets]) => ({ muscleGroup, sets }));

    // ─── 6. Recent sessions (last 5) ─────────────────────────────────────────
    const recentSessions = await prisma.workoutSession.findMany({
      where: { userId },
      take: 5,
      orderBy: { date: "desc" },
      include: {
        _count: { select: { workoutSets: true } },
        workoutSets: {
          distinct: ["equipmentId"],
          select: {
            equipment: { select: { muscleGroup: true } },
          },
        },
      },
    });

    const recentFormatted = recentSessions.map((s) => {
      const muscleGroups = [
        ...new Set(s.workoutSets.map((ws) => ws.equipment.muscleGroup)),
      ];
      return {
        id: s.id,
        date: s.date,
        totalSets: s._count.workoutSets,
        muscleGroups,
        notes: s.notes,
      };
    });

    return apiSuccess({
      totalSessions,
      totalSets,
      totalVolume: Math.round(totalVolume),
      thisWeekSessions,
      personalRecords,
      muscleGroupBreakdown: sortedMuscleGroups,
      recentSessions: recentFormatted,
    });
  } catch (err) {
    return apiServerError(err);
  }
}
