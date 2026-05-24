"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { X, Camera, Trash2, Loader2 } from "lucide-react";
import { useEquipmentStorage } from "@/hooks/useEquipmentStorage";
import { MuscleGroup } from "@/types/workout";

const MUSCLE_GROUPS: MuscleGroup[] = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Cardio",
  "Core",
  "Full Body",
];

interface EquipmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipmentModal({ open, onOpenChange }: EquipmentModalProps) {
  const { equipment, addEquipment, deleteEquipment } = useEquipmentStorage();
  const [tab, setTab] = useState<"create" | "manage">("create");

  // Form state
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("Chest");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && !isSubmitting;

  const handleAddEquipment = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);

    const result = await addEquipment({ name: name.trim(), muscleGroup });

    if (result) {
      // Reset form on success
      setName("");
      setMuscleGroup("Chest");
    }

    setIsSubmitting(false);
  };

  const handleDeleteEquipment = async (id: string) => {
    setDeletingId(id);
    await deleteEquipment(id);
    setDeletingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Equipment Manager
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add new equipment or manage existing ones
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border mb-4">
          <button
            onClick={() => setTab("create")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              tab === "create"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Add Equipment
          </button>
          <button
            onClick={() => setTab("manage")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              tab === "manage"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Manage ({equipment.length})
          </button>
        </div>

        {/* Create Tab */}
        {tab === "create" && (
          <div className="space-y-4">
            {/* Equipment Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Equipment Name
              </label>
              <Input
                placeholder="e.g., Barbell Bench Press, Dumbbell..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSubmit && handleAddEquipment()}
                className="bg-muted border-border"
              />
            </div>

            {/* Muscle Group */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Muscle Group
              </label>
              <select
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {MUSCLE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <Button
              onClick={handleAddEquipment}
              disabled={!canSubmit}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Add Equipment"
              )}
            </Button>
          </div>
        )}

        {/* Manage Tab */}
        {tab === "manage" && (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {equipment.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No equipment yet. Create your first one above!</p>
              </div>
            ) : (
              equipment.map((eq) => (
                <Card
                  key={eq.id}
                  className="p-3 space-y-2 bg-muted border-border"
                >
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">
                        {eq.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {eq.muscleGroup}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteEquipment(eq.id)}
                      disabled={deletingId === eq.id}
                      className="p-2 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                    >
                      {deletingId === eq.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      )}
                    </button>
                  </div>
                  {eq.imageUrl && (
                    <img
                      src={eq.imageUrl}
                      alt={eq.name}
                      className="w-full max-h-32 object-cover rounded"
                    />
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
