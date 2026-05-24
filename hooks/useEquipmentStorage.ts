"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface ApiEquipment {
  id: string;
  name: string;
  muscleGroup: string;
  imageUrl: string | null;
  notes: string | null;
  createdAt: string;
  userId: string;
}

export function useEquipmentStorage() {
  const [equipment, setEquipment] = useState<ApiEquipment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // ─── Fetch all equipment ───────────────────────────────────────────────────
  const fetchEquipment = useCallback(async () => {
    try {
      const res = await fetch("/api/equipment");
      if (!res.ok) throw new Error("Gagal memuat equipment");
      const json = await res.json();
      setEquipment(json.data ?? []);
    } catch (err) {
      console.error("[useEquipmentStorage] fetch error:", err);
      toast.error("Gagal memuat daftar equipment.");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  // ─── Add equipment ─────────────────────────────────────────────────────────
  const addEquipment = useCallback(
    async (data: {
      name: string;
      muscleGroup: string;
      imageUrl?: string | null;
      notes?: string | null;
    }) => {
      try {
        const res = await fetch("/api/equipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? "Gagal menambahkan equipment.");
          return null;
        }
        setEquipment((prev) => [...prev, json.data]);
        toast.success(json.message ?? "Equipment berhasil ditambahkan.");
        return json.data as ApiEquipment;
      } catch (err) {
        console.error("[useEquipmentStorage] addEquipment error:", err);
        toast.error("Terjadi kesalahan jaringan.");
        return null;
      }
    },
    [],
  );

  // ─── Update equipment ──────────────────────────────────────────────────────
  const updateEquipment = useCallback(
    async (
      id: string,
      data: {
        name?: string;
        muscleGroup?: string;
        imageUrl?: string | null;
        notes?: string | null;
      },
    ) => {
      try {
        const res = await fetch(`/api/equipment/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? "Gagal memperbarui equipment.");
          return null;
        }
        setEquipment((prev) => prev.map((e) => (e.id === id ? json.data : e)));
        toast.success(json.message ?? "Equipment berhasil diperbarui.");
        return json.data as ApiEquipment;
      } catch (err) {
        console.error("[useEquipmentStorage] updateEquipment error:", err);
        toast.error("Terjadi kesalahan jaringan.");
        return null;
      }
    },
    [],
  );

  // ─── Delete equipment ──────────────────────────────────────────────────────
  const deleteEquipment = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/equipment/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal menghapus equipment.");
        return false;
      }
      setEquipment((prev) => prev.filter((e) => e.id !== id));
      toast.success(json.message ?? "Equipment berhasil dihapus.");
      return true;
    } catch (err) {
      console.error("[useEquipmentStorage] deleteEquipment error:", err);
      toast.error("Terjadi kesalahan jaringan.");
      return false;
    }
  }, []);

  // ─── Derived helpers ───────────────────────────────────────────────────────
  const getByMuscleGroup = useCallback(
    (muscleGroup: string) =>
      equipment.filter((e) => e.muscleGroup === muscleGroup),
    [equipment],
  );

  const getById = useCallback(
    (id: string) => equipment.find((e) => e.id === id),
    [equipment],
  );

  return {
    equipment,
    isLoaded,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    getByMuscleGroup,
    getById,
    refresh: fetchEquipment,
  };
}
