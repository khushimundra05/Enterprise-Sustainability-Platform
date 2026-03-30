/**
 * response.ts
 *
 * Centralised HTTP response helpers and CORS headers.
 * Import these in every handler — never define headers inline.
 *
 * Note: "Access-Control-Allow-Credentials" must be the STRING "true",
 * not the boolean true. API Gateway rejects the boolean silently.
 */
import { CORS } from "./env";

export const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": CORS.ORIGIN,
  "Access-Control-Allow-Credentials": "true",
} as const;

export const CSV_HEADERS = (filename: string) => ({
  "Content-Type": "text/csv",
  "Content-Disposition": `attachment; filename=${filename}`,
  "Access-Control-Allow-Origin": CORS.ORIGIN,
  "Access-Control-Allow-Credentials": "true",
});

export const PDF_HEADERS = (filename: string) => ({
  "Content-Type": "application/pdf",
  "Content-Disposition": `attachment; filename=${filename}`,
  "Access-Control-Allow-Origin": CORS.ORIGIN,
  "Access-Control-Allow-Credentials": "true",
});

export const ok = (body: unknown, status = 200) => ({
  statusCode: status,
  headers: HEADERS,
  body: JSON.stringify(body),
});

export const created = (body: unknown) => ok(body, 201);

export const notFound = (message = "Not found") => ({
  statusCode: 404,
  headers: HEADERS,
  body: JSON.stringify({ message }),
});

export const badRequest = (message: string) => ({
  statusCode: 400,
  headers: HEADERS,
  body: JSON.stringify({ message }),
});

export const unauthorized = (message = "Unauthorized") => ({
  statusCode: 401,
  headers: HEADERS,
  body: JSON.stringify({ message }),
});

export const serverError = (message = "Internal server error") => ({
  statusCode: 500,
  headers: HEADERS,
  body: JSON.stringify({ message }),
});

/** Wraps a handler body; catches Unauthorized throws and maps them to 401 */
export function isAuthError(err: any): boolean {
  return (
    err?.message?.startsWith("Unauthorized") || err?.message === "Not found"
  );
}
