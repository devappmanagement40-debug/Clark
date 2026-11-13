import { QueryClient, QueryFunction } from "@tanstack/react-query";

export const PROCESSING_START_EVENT = "site:processing-start";
export const PROCESSING_END_EVENT = "site:processing-end";

export async function withProcessingIndicator<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROCESSING_START_EVENT));
  }

  try {
    return await operation();
  } finally {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(PROCESSING_END_EVENT));
    }
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    const fallbackMessage = res.status >= 500
      ? "Le serveur rencontre une erreur. Réessayez dans quelques instants."
      : "La requête n’a pas abouti. Vérifiez les informations saisies.";
    let message = fallbackMessage;
    let data: Record<string, any> | undefined;
    const contentType = res.headers.get("content-type")?.toLowerCase() || "";
    const isHtmlResponse =
      contentType.includes("text/html") ||
      /^\s*(?:<!doctype html|<html\b)/i.test(text);

    if (!isHtmlResponse) {
      try {
        data = JSON.parse(text);
        const candidate = data?.message || data?.error;
        if (typeof candidate === "string" && candidate.trim()) {
          const trimmed = candidate.trim();
          const containsMarkupOrEncodedPayload =
            /<!doctype html|<html\b|<svg\b|data:image\/[^;]+;base64,/i.test(trimmed) ||
            /[A-Za-z0-9+/]{512,}={0,2}/.test(trimmed);
          message = trimmed.length <= 300 && !containsMarkupOrEncodedPayload
            ? trimmed
            : fallbackMessage;
        }
      } catch {
        const trimmed = text.trim();
        const containsEncodedPayload = /[A-Za-z0-9+/]{512,}={0,2}/.test(trimmed);
        if (trimmed && trimmed.length <= 300 && !containsEncodedPayload) {
          message = trimmed;
        }
      }
    }
    const error = new Error(message) as Error & { status?: number; data?: Record<string, any> };
    error.status = res.status;
    error.data = data;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const tracksProcessing = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
  if (tracksProcessing && typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROCESSING_START_EVENT));
  }

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } finally {
    if (tracksProcessing && typeof window !== "undefined") {
      window.dispatchEvent(new Event(PROCESSING_END_EVENT));
    }
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
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
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 15_000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export const FRESH_PLATFORM_SETTINGS_QUERY_OPTIONS = {
  staleTime: 0,
  refetchOnMount: "always",
  refetchOnWindowFocus: true,
} as const;
