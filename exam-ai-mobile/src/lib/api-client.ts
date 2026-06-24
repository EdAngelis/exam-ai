import { Config } from '@/constants/config';
import { tokenStorage } from './secure-storage';

/**
 * Standard exam-ai-api envelope used by the user/auth controllers:
 * { message, data, token?, status }. Note the exam/question controllers are
 * older and return ad-hoc shapes instead (e.g. { message, exam },
 * { message, questions }, { message, id }) — so the api-client returns the full
 * parsed body typed by the caller, and each service reads the correct key.
 */
export type ApiEnvelope<T> = {
  message: string;
  data: T;
  token?: string;
  status: number;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type QueryValue = string | number | boolean | undefined | null;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Whether to attach the bearer access token. Defaults to true. */
  auth?: boolean;
};

/**
 * Invoked when a request fails authentication and cannot be recovered via a
 * token refresh. The auth context registers a handler here to force sign-out.
 */
let authFailureHandler: (() => void) | null = null;
export function setAuthFailureHandler(handler: (() => void) | null): void {
  authFailureHandler = handler;
}

// De-dupes concurrent refreshes: many in-flight requests hitting 401 at once
// should trigger a single refresh, not one each.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) return false;

    const res = await fetch(`${Config.apiUrl}/auth/mobile/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mobile-api-key': Config.mobileApiKey,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const body = (await res.json().catch(() => null)) as ApiEnvelope<{
      accessToken: string;
      refreshToken: string;
    }> | null;

    const data = body?.data;
    if (!data?.accessToken || !data?.refreshToken) return false;

    await tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return true;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = `${Config.apiUrl}/${path.replace(/^\/+/, '')}`;
  if (!query) return base;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options;
  const url = buildUrl(path, query);

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-mobile-api-key': Config.mobileApiKey,
    };
    if (auth) {
      const accessToken = await tokenStorage.getAccessToken();
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    }
    return fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();

  // Access token expired/invalid → try a single refresh, then replay once.
  if (res.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await doFetch();
    } else {
      authFailureHandler?.();
    }
  }

  const json = (await res.json().catch(() => null)) as
    | (Partial<{ message: string; error: string }> & Record<string, unknown>)
    | null;

  if (!res.ok) {
    if (res.status === 401 && auth) authFailureHandler?.();
    throw new ApiError(
      json?.message ?? json?.error ?? `Request failed with status ${res.status}`,
      res.status,
      json,
    );
  }

  return json as T;
}

export const apiClient = {
  get: <T>(path: string, query?: Record<string, QueryValue>, auth = true) =>
    request<T>(path, { method: 'GET', query, auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: 'POST', body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: 'PUT', body, auth }),
  delete: <T>(path: string, auth = true) =>
    request<T>(path, { method: 'DELETE', auth }),
};
