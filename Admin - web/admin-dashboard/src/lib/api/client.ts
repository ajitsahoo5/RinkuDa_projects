import { getFirebaseAuth } from "../firebase";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "Missing VITE_API_BASE_URL. Set it in .env (e.g. http://localhost:3000/api/v1).",
    );
  }
  return raw.replace(/\/+$/, "");
}

export function isApiConfigured(): boolean {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();
  return Boolean(raw);
}

export async function getAuthToken(): Promise<string> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new ApiError(401, "Not signed in.");
  }
  return user.getIdToken();
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (typeof data.message === "string" && data.message.trim()) return data.message;
  } catch {
    /* ignore */
  }
  return res.statusText || `HTTP ${res.status}`;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAuthToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}
