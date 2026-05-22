"use client";

import { useState, useRef } from "react";
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
import { X, Camera, Trash2 } from "lucide-react";
import { useEquipmentStorage } from "@/hooks/useEquipmentStorage";
import { Equipment, MuscleGroup } from "@/types/workout";

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
  const { equipment, addEquipment, deleteEquipment, updateEquipment } =
    useEquipmentStorage();
  const [tab, setTab] = useState<"create" | "manage">("create");

  // Form state
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("Chest");
  const [photoBase64, setPhotoBase64] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddEquipment = () => {
    if (!name.trim()) return;

    const newEquipment: Equipment = {
      id: `equipment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      muscleGroup,
      photoBase64,
      createdAt: Date.now(),
    };

    addEquipment(newEquipment);

    // Reset form
    setName("");
    setMuscleGroup("Chest");
    setPhotoBase64(undefined);
  };

  const handleDeleteEquipment = (id: string) => {
    deleteEquipment(id);
  };

  const handleUpdateEquipment = (id: string, eq: Equipment) => {
    updateEquipment(id, eq);
  };

  const canSubmit = name.trim().length > 0;

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

            {/* Photo Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Photo (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                capture="environment"
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1 border-border hover:bg-muted"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                {photoBase64 && (
                  <Button
                    onClick={() => setPhotoBase64(undefined)}
                    variant="outline"
                    className="border-border hover:bg-muted"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Photo Preview */}
              {photoBase64 && (
                <div className="p-2 bg-muted rounded-lg">
                  <img
                    src={photoBase64}
                    alt="Equipment preview"
                    className="w-full max-h-48 object-cover rounded"
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              onClick={handleAddEquipment}
              disabled={!canSubmit}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Add Equipment
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
                      className="p-2 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                  {eq.photoBase64 && (
                    <img
                      src={eq.photoBase64}
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
