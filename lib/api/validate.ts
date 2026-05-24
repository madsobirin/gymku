import { z, ZodSchema } from "zod";
import { NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";

type ValidateResult<T> =
  | { success: true; data: T }
  | { success: false; response: ReturnType<typeof apiError> };

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns either the typed data or a formatted 422 error response.
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
): Promise<ValidateResult<T>> {
  let raw: unknown;

  try {
    raw = await req.json();
  } catch {
    return {
      success: false,
      response: apiError("Request body harus berupa JSON yang valid.", 422),
    };
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    return {
      success: false,
      response: apiError("Validasi gagal. Periksa kembali input Anda.", 422, details),
    };
  }

  return { success: true, data: result.data };
}
