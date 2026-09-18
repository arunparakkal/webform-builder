import type { FormDefinition } from "@webform/form-schema";
import { getAuthToken, useAuthStore, type AuthUser } from "../store/authStore";

export type FormSummary = {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  status: string;
  publishedVersionId: string | null;
  draftDefinition?: FormDefinition;
  createdAt: string;
  updatedAt: string;
};

export type FormDetail = FormSummary & {
  draftDefinition: FormDefinition;
  publishedVersion: {
    id: string;
    revision: number;
    definition: FormDefinition;
  } | null;
  versions: Array<{
    id: string;
    revision: number;
    createdAt: string;
  }>;
};

export type SubmissionItem = {
  id: string;
  formVersionId: string;
  revision: number;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type SubmissionsResponse = {
  items: SubmissionItem[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
  nextCursor: string | null;
};

export type HourlyStatsResponse = {
  formId: string;
  from: string;
  to: string;
  /** One entry per hour that had at least one submission. Bounds are UTC. */
  buckets: Array<{ windowStart: string; windowEnd: string; count: number }>;
  total: number;
  updatedAt: string | null;
};

/** Flink-style keyed state: (form, hour) → count */
export type KeyedHourlyStatsResponse = {
  from: string;
  to: string;
  keys: Array<{
    formId: string;
    formTitle: string;
    formSlug: string;
    windowStart: string;
    windowEnd: string;
    count: number;
  }>;
};

export type PublishedForm = {
  ownerId: string;
  slug: string;
  revision: number;
  formVersionId: string;
  definition: FormDefinition;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

/** Empty in local dev (Vite proxies `/api` → API). Set to Render URL in production. */
function apiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? "";
  return raw.replace(/\/$/, "");
}

function apiUrl(path: string): string {
  const base = apiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

function formatApiError(body: { error?: unknown }): string {
  const err = body.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const flat = err as {
      formErrors?: string[];
      fieldErrors?: Record<string, string[] | undefined>;
    };
    if (Array.isArray(flat.formErrors) && flat.formErrors[0]) return flat.formErrors[0];
    if (flat.fieldErrors) {
      for (const messages of Object.values(flat.fieldErrors)) {
        if (messages?.[0]) return messages[0];
      }
    }
    return JSON.stringify(err);
  }
  return "Request failed";
}

async function request<T>(path: string, init?: RequestInit & { auth?: boolean }): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };

  // Fastify rejects Content-Type: application/json with an empty body (e.g. Publish POST).
  if (init?.body !== undefined && init.body !== null) {
    headers["Content-Type"] = "application/json";
  }

  const useAuth = init?.auth !== false;
  const token = getAuthToken();
  if (useAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const { auth: _auth, ...fetchInit } = init ?? {};
  const response = await fetch(apiUrl(path), {
    ...fetchInit,
    headers,
  });

  if (response.status === 401 && useAuth && token) {
    useAuthStore.getState().clearSession();
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: unknown };
      message = formatApiError(body) || message;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  signup: (body: {
    name?: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }) =>
    request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    }),

  signin: (body: { email: string; password: string }) =>
    request<AuthResponse>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    }),

  supabaseAuth: (accessToken: string) =>
    request<AuthResponse>("/api/auth/supabase", {
      method: "POST",
      body: JSON.stringify({ accessToken }),
      auth: false,
    }),

  me: () => request<{ user: AuthUser & { createdAt: string } }>("/api/auth/me"),

  listForms: () => request<FormSummary[]>("/api/forms"),

  createForm: (title: string, slug: string) =>
    request<FormDetail>("/api/forms", {
      method: "POST",
      body: JSON.stringify({ title, slug }),
    }),

  getForm: (id: string) => request<FormDetail>(`/api/forms/${id}`),

  updateForm: (
    id: string,
    body: { title?: string; slug?: string; draftDefinition?: FormDefinition },
  ) =>
    request<FormDetail>(`/api/forms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  publishForm: (id: string) =>
    request<{
      formId: string;
      ownerId: string;
      slug: string;
      status: string;
      versionId: string;
      revision: number;
    }>(`/api/forms/${id}/publish`, { method: "POST" }),

  listSubmissions: (
    id: string,
    params: {
      page?: number;
      limit?: number;
      revision?: number;
      from?: string;
      to?: string;
    },
  ) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.revision) query.set("revision", String(params.revision));
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    const qs = query.toString();
    return request<SubmissionsResponse>(`/api/forms/${id}/submissions${qs ? `?${qs}` : ""}`);
  },

  hourlyStats: (id: string, params?: { hours?: number; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.hours) query.set("hours", String(params.hours));
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const qs = query.toString();
    return request<HourlyStatsResponse>(`/api/forms/${id}/stats/hourly${qs ? `?${qs}` : ""}`);
  },

  keyedHourlyStats: (params?: { hours?: number; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.hours) query.set("hours", String(params.hours));
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const qs = query.toString();
    return request<KeyedHourlyStatsResponse>(`/api/stats/hourly${qs ? `?${qs}` : ""}`);
  },

  exportSubmissions: async (
    id: string,
    params?: { revision?: number; from?: string; to?: string },
  ) => {
    const token = getAuthToken();
    const query = new URLSearchParams();
    if (params?.revision) query.set("revision", String(params.revision));
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const qs = query.toString();
    const response = await fetch(apiUrl(`/api/forms/${id}/submissions/export${qs ? `?${qs}` : ""}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.status === 401 && token) {
      useAuthStore.getState().clearSession();
    }
    if (!response.ok) {
      throw new Error(`Export failed (${response.status})`);
    }
    return response.blob();
  },

  getPublishedForm: (ownerId: string, slug: string) =>
    request<PublishedForm>(
      `/api/public/forms/${encodeURIComponent(ownerId)}/${encodeURIComponent(slug)}`,
      { auth: false },
    ),

  submitPublicForm: (
    ownerId: string,
    slug: string,
    body: { payload: Record<string, unknown>; website?: string; idempotencyKey?: string },
  ) =>
    request<{ accepted: boolean; idempotencyKey?: string; formVersionId?: string }>(
      `/api/public/forms/${encodeURIComponent(ownerId)}/${encodeURIComponent(slug)}/submissions`,
      {
        method: "POST",
        body: JSON.stringify(body),
        auth: false,
      },
    ),

  aiCreateForm: (message: string, history?: Array<{ role: "user" | "assistant"; content: string }>) =>
    request<
      | { kind: "clarify"; reply: string }
      | {
          kind: "create";
          reply: string;
          form: {
            id: string;
            ownerId: string;
            title: string;
            slug: string;
            status: string;
          };
          fieldCount: number;
        }
    >("/api/ai/forms", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),

  aiEditForm: (
    formId: string,
    body: {
      message: string;
      definition: FormDefinition;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    },
  ) =>
    request<
      | { kind: "clarify"; reply: string }
      | { kind: "update"; reply: string; definition: FormDefinition; fieldCount: number }
    >(`/api/ai/forms/${encodeURIComponent(formId)}/edit`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
