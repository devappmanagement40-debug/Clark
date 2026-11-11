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
    let message = res.statusText;
    let data: Record<string, any> | undefined;
    try {
      data = JSON.parse(text);
      message = data?.message || data?.error || res.statusText;
    } catch {
      message = text || res.statusText;
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
