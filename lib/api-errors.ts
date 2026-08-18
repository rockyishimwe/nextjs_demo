import { NextResponse } from "next/server";

/**
 * Standardized success response.
 * Shape: { message, ...data }
 */
export function apiOk(
  data: Record<string, unknown> = {},
  status = 200,
  headers?: Record<string, string>,
) {
  return NextResponse.json(data, { status, headers });
}

/**
 * Standardized error response.
 * Logs the real error server-side (optional), returns a safe generic message to the client.
 * Shape: { message }
 */
export function apiError(message: string, status = 500, logError?: unknown) {
  if (logError !== undefined) {
    console.error(`[${status}] ${message}:`, logError);
  }
  return NextResponse.json({ message }, { status });
}
