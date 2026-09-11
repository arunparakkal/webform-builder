import type { FormDefinition } from "@webform/form-schema";

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === "string") message = body.error;
      else if (body.error) message = JSON.stringify(body.error);
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
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

  exportSubmissionsUrl: (id: string) => `/api/forms/${id}/submissions/export`,

  getPublishedForm: (slug: string) => request<PublishedForm>(`/api/public/forms/${slug}`),

  submitPublicForm: (
    slug: string,
    body: { payload: Record<string, unknown>; website?: string; idempotencyKey?: string },
  ) =>
    request<{ accepted: boolean; idempotencyKey?: string; formVersionId?: string }>(
      `/api/public/forms/${slug}/submissions`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
};
