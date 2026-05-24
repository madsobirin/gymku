import { v2 as cloudinary } from "cloudinary";
import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/session";
import {
  apiUnauthorized,
  apiError,
  apiSuccess,
  apiServerError,
} from "@/lib/api/response";

// Configure once — values pulled from .env at runtime
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * POST /api/upload
 * Accepts multipart/form-data with a single "file" field.
 * Returns { url, publicId } on success.
 *
 * Only authenticated users can upload.
 * Files are stored in the "gym-tracker" folder on Cloudinary.
 */
export async function POST(req: NextRequest) {
  // ─── Auth guard ────────────────────────────────────────────────────────────
  const userId = await requireUserId().catch(() => null);
  if (!userId) return apiUnauthorized();

  // ─── Validate Cloudinary env config ────────────────────────────────────────
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return apiError(
      "Konfigurasi Cloudinary belum lengkap. Isi CLOUDINARY_* di file .env.",
      500,
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return apiError("Field 'file' wajib ada dan harus berupa file.", 400);
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return apiError(
        "Tipe file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.",
        400,
      );
    }

    // Validate file size (max 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return apiError("Ukuran file maksimal 5MB.", 400);
    }

    // Convert file to ArrayBuffer → Buffer for Cloudinary upload stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload via upload_stream wrapped in a Promise
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `gym-tracker/${userId}`,
            resource_type: "image",
            transformation: [
              { width: 800, height: 800, crop: "limit" }, // max dimension
              { quality: "auto:good" }, // auto quality
              { fetch_format: "auto" }, // auto format (WebP etc)
            ],
          },
          (error, result) => {
            if (error || !result)
              return reject(error ?? new Error("Upload failed"));
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          },
        );
        stream.end(buffer);
      },
    );

    return apiSuccess(
      { url: result.secure_url, publicId: result.public_id },
      "Gambar berhasil diupload.",
    );
  } catch (err) {
    return apiServerError(err);
  }
}
