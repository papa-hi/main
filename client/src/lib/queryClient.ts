import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// --- CSRF token cache ---
let csrfToken: string | null = null;

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/csrf-token", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    csrfToken = data.csrfToken ?? null;
    return csrfToken;
  } catch {
    return null;
  }
}

async function getCsrfToken(): Promise<string | null> {
  return csrfToken ?? fetchCsrfToken();
}

export function clearCsrfToken() {
  csrfToken = null;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// --- Central API request helper ---
export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  _isRetry = false
): Promise<Response> {
  const body = data ? JSON.stringify(data) : undefined;
  const headers: Record<string, string> = {};

  if (body) headers["Content-Type"] = "application/json";

  if (MUTATING_METHODS.has(method.toUpperCase())) {
    const token = await getCsrfToken();
    if (token) headers["x-csrf-token"] = token;
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  // If CSRF token is stale (e.g., user re-logged in on another tab), clear and retry once
  if (res.status === 403 && !_isRetry) {
    clearCsrfToken();
    return apiRequest(method, url, data, true);
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
