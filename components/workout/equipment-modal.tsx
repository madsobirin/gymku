"use client";

import { useState, useRef, useCallback } from "react";
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
import {
  X,
  Upload,
  Trash2,
  Loader2,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useEquipmentStorage } from "@/hooks/useEquipmentStorage";
import { MuscleGroup } from "@/types/workout";
import { toast } from "sonner";

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

type UploadState = "idle" | "uploading" | "done" | "error";

export function EquipmentModal({ open, onOpenChange }: EquipmentModalProps) {
  const { equipment, addEquipment, deleteEquipment } = useEquipmentStorage();
  const [tab, setTab] = useState<"create" | "manage">("create");

  // Form state
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("Chest");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = name.trim().length > 0 && !isSubmitting && uploadState !== "uploading";

  // ─── Upload image to Cloudinary via our API route ────────────────────────────
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      setImageUrl(null);
      setUploadState("uploading");

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();

        if (!res.ok) {
          toast.error(json.error ?? "Gagal mengupload gambar.");
          setUploadState("error");
          setImagePreview(null);
          return;
        }

        setImageUrl(json.data.url);
        setUploadState("done");
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Gagal menghubungi server upload.");
        setUploadState("error");
        setImagePreview(null);
      } finally {
        // Reset file input so same file can be re-picked
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [],
  );

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImagePreview(null);
    setUploadState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleAddEquipment = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);

    const result = await addEquipment({
      name: name.trim(),
      muscleGroup,
      imageUrl: imageUrl ?? null,
      notes: notes.trim() || null,
    });

    if (result) {
      setName("");
      setMuscleGroup("Chest");
      setNotes("");
      setImageUrl(null);
      setImagePreview(null);
      setUploadState("idle");
    }

    setIsSubmitting(false);
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteEquipment = async (id: string) => {
    setDeletingId(id);
    await deleteEquipment(id);
    setDeletingId(null);
  };

  // ─── Upload status indicator ─────────────────────────────────────────────────
  const UploadStatusIcon = () => {
    if (uploadState === "uploading")
      return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
    if (uploadState === "done")
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (uploadState === "error")
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Equipment Manager</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Tambah alat gym baru atau kelola yang sudah ada
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border mb-4">
          <button
            onClick={() => setTab("create")}
            className={`px-4 py-2 border-b-2 transition-colors text-sm font-medium ${
              tab === "create"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Tambah Alat
          </button>
          <button
            onClick={() => setTab("manage")}
            className={`px-4 py-2 border-b-2 transition-colors text-sm font-medium ${
              tab === "manage"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Kelola ({equipment.length})
          </button>
        </div>

        {/* ── Create Tab ───────────────────────────────────────────────────────── */}
        {tab === "create" && (
          <div className="space-y-5">
            {/* Equipment Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Nama Alat <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="cth: Barbell Bench Press, Dumbbell 10kg..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && canSubmit && handleAddEquipment()
                }
                className="bg-muted border-border"
              />
            </div>

            {/* Muscle Group */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Muscle Group <span className="text-destructive">*</span>
              </label>
              <select
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              >
                {MUSCLE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Catatan <span className="text-muted-foreground text-xs">(opsional)</span>
              </label>
              <textarea
                placeholder="cth: Barbell 20kg, ukuran grip medium, ada di rak sebelah kiri..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground text-right">
                {notes.length}/500
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Foto Alat{" "}
                <span className="text-muted-foreground text-xs">(opsional, max 5MB)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Preview / Upload Zone */}
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-56 object-cover"
                  />
                  {/* Overlay with status */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {uploadState === "uploading" && (
                      <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Mengupload...
                      </div>
                    )}
                    {uploadState === "done" && (
                      <div className="bg-green-500/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Siap
                      </div>
                    )}
                    {uploadState !== "uploading" && (
                      <button
                        onClick={handleRemoveImage}
                        className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border hover:border-primary rounded-xl p-8 flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground transition-all group"
                >
                  <div className="w-12 h-12 bg-muted group-hover:bg-primary/10 rounded-xl flex items-center justify-center transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Klik untuk upload foto</p>
                    <p className="text-xs mt-1">JPG, PNG, WEBP, GIF · Max 5MB</p>
                  </div>
                </button>
              )}

              {uploadState === "error" && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Upload gagal. Coba lagi dengan file yang berbeda.
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              onClick={handleAddEquipment}
              disabled={!canSubmit}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Tambah Equipment"
              )}
            </Button>
          </div>
        )}

        {/* ── Manage Tab ───────────────────────────────────────────────────────── */}
        {tab === "manage" && (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {equipment.length === 0 ? (
              <div className="p-10 text-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  Belum ada equipment. Tambahkan di tab sebelah!
                </p>
              </div>
            ) : (
              equipment.map((eq) => (
                <Card
                  key={eq.id}
                  className="p-3 bg-muted border-border overflow-hidden"
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    {eq.imageUrl ? (
                      <img
                        src={eq.imageUrl}
                        alt={eq.name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground text-sm truncate">
                            {eq.name}
                          </h4>
                          <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-0.5">
                            {eq.muscleGroup}
                          </span>
                          {eq.notes && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {eq.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteEquipment(eq.id)}
                          disabled={deletingId === eq.id}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                          {deletingId === eq.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-destructive" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
