/**
 * Base URL of the shared backend.
 *
 * Empty string = same origin, which is what the Vite dev proxy expects locally.
 * In production (e.g. on Vercel) set `VITE_BACKEND_URL` to the hosted backend,
 * for example `https://office-backend.onrender.com`, so the dashboard connects
 * to it directly instead of to the static host.
 */
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "";

export const apiUrl = (path: string): string => `${BACKEND_URL}${path}`;
