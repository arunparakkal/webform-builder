import type { FormDefinition } from "@webform/form-schema";
import { getAuthToken, useAuthStore, type AuthUser } from "../store/authStore";

export type FormSummary = {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedVersionId: string | null;
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
  nextCursor: string | null;
};

export type PublishedForm = {
  slug: string;
  revision: number;
  formVersionId: string;
  definition: FormDefinition;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

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
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  const useAuth = init?.auth !== false;
  const token = getAuthToken();
  if (useAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const { auth: _auth, ...fetchInit } = init ?? {};
  const response = await fetch(path, {
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
      slug: string;
      status: string;
      versionId: string;
      revision: number;
    }>(`/api/forms/${id}/publish`, { method: "POST" }),

  listSubmissions: (id: string, params: { cursor?: string; limit?: number; revision?: number }) => {
    const query = new URLSearchParams();
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.limit) query.set("limit", String(params.limit));
    if (params.revision) query.set("revision", String(params.revision));
    const qs = query.toString();
    return request<SubmissionsResponse>(`/api/forms/${id}/submissions${qs ? `?${qs}` : ""}`);
  },

  exportSubmissions: async (id: string) => {
    const token = getAuthToken();
    const response = await fetch(`/api/forms/${id}/submissions/export`, {
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

  getPublishedForm: (slug: string) =>
    request<PublishedForm>(`/api/public/forms/${slug}`, { auth: false }),

  submitPublicForm: (
    slug: string,
    body: { payload: Record<string, unknown>; website?: string; idempotencyKey?: string },
  ) =>
    request<{ accepted: boolean; idempotencyKey?: string; formVersionId?: string }>(
      `/api/public/forms/${slug}/submissions`,
      {
        method: "POST",
        body: JSON.stringify(body),
        auth: false,
      },
    ),
};
