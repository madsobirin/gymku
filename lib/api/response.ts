import { NextResponse } from "next/server";

// ─── Standard API Response Shape ──────────────────────────────────────────────

type ApiSuccessPayload<T> = {
  data: T;
  message?: string;
};

type ApiErrorPayload = {
  error: string;
  details?: unknown;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function apiSuccess<T>(
  payload: T,
  message?: string,
  status: 200 | 201 = 200,
): NextResponse<ApiSuccessPayload<T>> {
  return NextResponse.json({ data: payload, message }, { status });
}

export function apiCreated<T>(
  payload: T,
  message?: string,
): NextResponse<ApiSuccessPayload<T>> {
  return apiSuccess(payload, message, 201);
}

export function apiError(
  error: string,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 500 = 400,
  details?: unknown,
): NextResponse<ApiErrorPayload> {
  return NextResponse.json({ error, details }, { status });
}

export function apiUnauthorized(): NextResponse<ApiErrorPayload> {
  return apiError("Unauthorized. Silakan login terlebih dahulu.", 401);
}

export function apiNotFound(resource = "Resource"): NextResponse<ApiErrorPayload> {
  return apiError(`${resource} tidak ditemukan.`, 404);
}

export function apiForbidden(): NextResponse<ApiErrorPayload> {
  return apiError("Akses ditolak.", 403);
}

export function apiConflict(message: string): NextResponse<ApiErrorPayload> {
  return apiError(message, 409);
}

export function apiServerError(err?: unknown): NextResponse<ApiErrorPayload> {
  console.error("[API Server Error]", err);
  return apiError("Terjadi kesalahan server. Coba lagi nanti.", 500);
}
