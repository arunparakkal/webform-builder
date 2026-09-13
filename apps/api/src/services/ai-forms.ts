import { randomUUID } from "node:crypto";
import {
  emptyFormDefinition,
  formDefinitionSchema,
  type FormDefinition,
  type FormField,
} from "@webform/form-schema";
import { prisma } from "@webform/db";
import { createForm } from "./forms.js";

const CHOICE_TYPES = new Set(["select", "multiselect", "radio", "checkbox"]);

export type AiChatTurn = { role: "user" | "assistant"; content: string };

export type AiFormPlan = {
  reply: string;
  action: "clarify" | "create" | "update";
  title?: string;
  slug?: string;
  definition?: unknown;
};

export type AiFormResult =
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
    };

export type AiProviderConfig =
  | { provider: "gemini"; apiKey: string; model: string }
  | { provider: "openai"; apiKey: string; model: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function snakeName(label: string, fallback: string): string {
  const base = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  if (base && /^[a-z][a-z0-9_]*$/.test(base)) return base.slice(0, 40);
  return fallback;
}

/** Normalize model output into a Zod-valid FormDefinition. */
export function normalizeAiDefinition(
  raw: unknown,
  fallbackTitle: string,
): FormDefinition {
  const base = emptyFormDefinition(fallbackTitle);
  const input =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const meta =
    input.meta && typeof input.meta === "object"
      ? (input.meta as Record<string, unknown>)
      : {};
  const settings =
    input.settings && typeof input.settings === "object"
      ? (input.settings as Record<string, unknown>)
      : {};
  const rawFields = Array.isArray(input.fields) ? input.fields : [];

  const fields: FormField[] = [];
  const usedNames = new Set<string>();

  for (const [index, item] of rawFields.entries()) {
    if (!item || typeof item !== "object") continue;
    const f = item as Record<string, unknown>;
    const type = typeof f.type === "string" ? f.type : "text";
    const label =
      typeof f.label === "string" && f.label.trim()
        ? f.label.trim()
        : `Field ${index + 1}`;
    let name =
      typeof f.name === "string" && f.name.trim()
        ? f.name.trim()
        : snakeName(label, `field_${index + 1}`);
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      name = snakeName(label, `field_${index + 1}`);
    }
    let unique = name;
    let n = 2;
    while (usedNames.has(unique)) {
      unique = `${name}_${n}`.slice(0, 40);
      n += 1;
    }
    usedNames.add(unique);

    const id =
      typeof f.id === "string" && f.id.trim() ? f.id.trim() : randomUUID();

    let options: FormField["options"] = [];
    if (CHOICE_TYPES.has(type) && Array.isArray(f.options)) {
      options = f.options
        .filter((o): o is Record<string, unknown> => Boolean(o) && typeof o === "object")
        .map((o, oi) => {
          const optLabel =
            typeof o.label === "string" && o.label.trim()
              ? o.label.trim()
              : `Option ${oi + 1}`;
          const optValue =
            typeof o.value === "string" && o.value.trim()
              ? o.value.trim()
              : snakeName(optLabel, `option_${oi + 1}`);
          return {
            id:
              typeof o.id === "string" && o.id.trim()
                ? o.id.trim()
                : randomUUID(),
            label: optLabel,
            value: optValue,
          };
        });
      if (options.length === 0) {
        options = [
          { id: randomUUID(), label: "Option 1", value: "option_1" },
          { id: randomUUID(), label: "Option 2", value: "option_2" },
        ];
      }
    }

    const validation =
      f.validation && typeof f.validation === "object"
        ? (f.validation as FormField["validation"])
        : {};

    fields.push({
      id,
      type: type as FormField["type"],
      name: unique,
      label,
      placeholder: typeof f.placeholder === "string" ? f.placeholder : "",
      helpText: typeof f.helpText === "string" ? f.helpText : "",
      required: Boolean(f.required),
      validation,
      options: CHOICE_TYPES.has(type) ? options : [],
      visibility: { mode: "always" },
    });
  }

  const candidate = {
    schemaVersion: 1 as const,
    meta: {
      title:
        typeof meta.title === "string" && meta.title.trim()
          ? meta.title.trim()
          : fallbackTitle,
      description: typeof meta.description === "string" ? meta.description : "",
    },
    settings: {
      submitLabel:
        typeof settings.submitLabel === "string" && settings.submitLabel.trim()
          ? settings.submitLabel.trim()
          : base.settings.submitLabel,
      successMessage:
        typeof settings.successMessage === "string" &&
        settings.successMessage.trim()
          ? settings.successMessage.trim()
          : base.settings.successMessage,
    },
    theme: base.theme,
    fields,
  };

  const parsed = formDefinitionSchema.safeParse(candidate);
  if (!parsed.success) {
    throw Object.assign(
      new Error(
        `AI form definition invalid: ${parsed.error.issues
          .slice(0, 3)
          .map((i) => i.message)
          .join("; ")}`,
      ),
      { statusCode: 422 },
    );
  }
  return parsed.data as FormDefinition;
}

const SYSTEM_PROMPT = `You help users design web forms for FormBuilder.
Return ONLY valid JSON with this shape:
{
  "reply": "short friendly message to the user",
  "action": "clarify" | "create",
  "title": "form title when action=create",
  "slug": "kebab-case-url-slug when action=create",
  "definition": {
    "schemaVersion": 1,
    "meta": { "title": string, "description": string },
    "settings": { "submitLabel": string, "successMessage": string },
    "fields": [
      {
        "id": "stable-id",
        "type": "text"|"email"|"number"|"textarea"|"select"|"multiselect"|"radio"|"checkbox"|"date",
        "name": "snake_case",
        "label": string,
        "placeholder": string,
        "helpText": string,
        "required": boolean,
        "validation": {},
        "options": [{ "id": string, "label": string, "value": string }],
        "visibility": { "mode": "always" }
      }
    ]
  }
}

Rules:
- If the request is vague, set action="clarify" and ask 1–2 short questions. Omit definition.
- If you can build a useful form, set action="create" with 3–12 fields.
- Choice types (select, multiselect, radio, checkbox) need options (2+). Non-choice types must have options: [].
- Field names: snake_case starting with a letter. Unique names and ids.
- Prefer visibility mode "always" only.
- Do not invent themes. Keep reply under 80 words.
- Never refuse ordinary business forms (contact, signup, feedback, RSVP, job application, etc.).`;

function parsePlanFromJson(content: string, providerLabel: string): AiFormPlan {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    const fenced = content.match(/\{[\s\S]*\}/);
    if (!fenced) {
      throw Object.assign(new Error(`${providerLabel} returned invalid JSON`), {
        statusCode: 502,
      });
    }
    try {
      parsed = JSON.parse(fenced[0]);
    } catch {
      throw Object.assign(new Error(`${providerLabel} returned invalid JSON`), {
        statusCode: 502,
      });
    }
  }

  const obj = parsed as Record<string, unknown>;
  const action =
    obj.action === "create" || obj.action === "update" ? obj.action : "clarify";
  const reply =
    typeof obj.reply === "string" && obj.reply.trim()
      ? obj.reply.trim()
      : action === "clarify"
        ? "Could you share a bit more detail about the form you need?"
        : "Done — I updated the form draft.";

  return {
    reply,
    action,
    title: typeof obj.title === "string" ? obj.title : undefined,
    slug: typeof obj.slug === "string" ? obj.slug : undefined,
    definition: obj.definition,
  };
}

async function callGemini(
  apiKey: string,
  model: string,
  history: AiChatTurn[],
  message: string,
  systemPrompt: string = SYSTEM_PROMPT,
): Promise<AiFormPlan> {
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  for (const turn of history.slice(-8)) {
    contents.push({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    });
  }
  contents.push({ role: "user", parts: [{ text: message }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(
      new Error(
        res.status === 400 || res.status === 403
          ? `Gemini API key rejected or invalid. Check GEMINI_API_KEY. (${text.slice(0, 160)})`
          : `Gemini request failed (${res.status}): ${text.slice(0, 200)}`,
      ),
      { statusCode: 502 },
    );
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!content.trim()) {
    throw Object.assign(new Error("Gemini returned an empty response"), {
      statusCode: 502,
    });
  }
  return parsePlanFromJson(content, "Gemini");
}

async function callOpenAi(
  apiKey: string,
  model: string,
  history: AiChatTurn[],
  message: string,
  systemPrompt: string = SYSTEM_PROMPT,
): Promise<AiFormPlan> {
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8).map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: message },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(
      new Error(
        res.status === 401
          ? "OpenAI API key rejected. Check OPENAI_API_KEY."
          : `OpenAI request failed (${res.status}): ${text.slice(0, 200)}`,
      ),
      { statusCode: 502 },
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw Object.assign(new Error("OpenAI returned an empty response"), {
      statusCode: 502,
    });
  }

  return parsePlanFromJson(content, "OpenAI");
}

async function runLlm(
  llm: AiProviderConfig,
  history: AiChatTurn[],
  message: string,
  systemPrompt: string,
): Promise<AiFormPlan> {
  return llm.provider === "gemini"
    ? callGemini(llm.apiKey, llm.model, history, message, systemPrompt)
    : callOpenAi(llm.apiKey, llm.model, history, message, systemPrompt);
}

async function uniqueSlug(ownerId: string, preferred: string): Promise<string> {
  let base = slugify(preferred) || `form-${Date.now().toString(36)}`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(base)) {
    base = `form-${Date.now().toString(36)}`;
  }
  let candidate = base;
  for (let i = 0; i < 20; i += 1) {
    const taken = await prisma.form.findFirst({
      where: { ownerId, slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
    candidate = `${base}-${(i + 2).toString(36)}`.slice(0, 64);
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

export async function generateFormFromChat(input: {
  ownerId: string;
  message: string;
  history?: AiChatTurn[];
  llm: AiProviderConfig;
}): Promise<AiFormResult> {
  const history = input.history ?? [];
  const plan = await runLlm(input.llm, history, input.message, SYSTEM_PROMPT);

  if (plan.action !== "create" || !plan.definition) {
    return { kind: "clarify", reply: plan.reply };
  }

  const title =
    (plan.title && plan.title.trim()) ||
    (typeof (plan.definition as { meta?: { title?: string } })?.meta?.title ===
    "string"
      ? (plan.definition as { meta: { title: string } }).meta.title
      : "AI form");

  const definition = normalizeAiDefinition(plan.definition, title);
  const slug = await uniqueSlug(
    input.ownerId,
    plan.slug || definition.meta.title || title,
  );

  const form = await createForm(input.ownerId, definition.meta.title, slug);
  const updated = await prisma.form.update({
    where: { id: form.id },
    data: {
      title: definition.meta.title,
      draftDefinition: definition,
    },
  });

  return {
    kind: "create",
    reply: plan.reply,
    form: {
      id: updated.id,
      ownerId: updated.ownerId,
      title: updated.title,
      slug: updated.slug,
      status: updated.status,
    },
    fieldCount: definition.fields.length,
  };
}

const EDIT_SYSTEM_PROMPT = `You are a form editor copilot for FormBuilder.
The user already has a draft form. Apply their edit request (add fields, rename labels, change types, remove fields, tweak settings).

Return ONLY valid JSON:
{
  "reply": "short friendly summary of what you changed",
  "action": "clarify" | "update",
  "definition": { full FormDefinition when action=update }
}

FormDefinition shape:
{
  "schemaVersion": 1,
  "meta": { "title": string, "description": string },
  "settings": { "submitLabel": string, "successMessage": string },
  "fields": [ { "id", "type", "name", "label", "placeholder", "helpText", "required", "validation", "options", "visibility" } ]
}

Field types: text|email|number|textarea|select|multiselect|radio|checkbox|date
Rules:
- When action=update, return the COMPLETE updated fields array (keep fields the user did not ask to remove).
- Preserve existing field ids when editing the same field; new fields get new ids.
- Choice types need options (2+). Non-choice types must have options: [].
- Field names: snake_case, unique. visibility: { "mode": "always" } unless asked otherwise.
- Do not invent themes. Keep reply under 60 words.
- If the request is unclear, action=clarify and ask 1 short question (omit definition).`;

function summarizeDefinition(definition: FormDefinition): string {
  const fields = definition.fields.map((f) => ({
    id: f.id,
    type: f.type,
    name: f.name,
    label: f.label,
    required: f.required,
    options: f.options.map((o) => ({ label: o.label, value: o.value })),
  }));
  return JSON.stringify(
    {
      meta: definition.meta,
      settings: definition.settings,
      fields,
    },
    null,
    2,
  );
}

export type AiEditResult =
  | { kind: "clarify"; reply: string }
  | {
      kind: "update";
      reply: string;
      definition: FormDefinition;
      fieldCount: number;
    };

export async function editFormFromChat(input: {
  current: FormDefinition;
  message: string;
  history?: AiChatTurn[];
  llm: AiProviderConfig;
}): Promise<AiEditResult> {
  const history = input.history ?? [];
  const userPayload = `Current form draft:\n${summarizeDefinition(input.current)}\n\nUser request:\n${input.message}`;
  const plan = await runLlm(input.llm, history, userPayload, EDIT_SYSTEM_PROMPT);

  if (plan.action !== "update" || !plan.definition) {
    return { kind: "clarify", reply: plan.reply };
  }

  const title =
    (typeof (plan.definition as { meta?: { title?: string } })?.meta?.title === "string"
      ? (plan.definition as { meta: { title: string } }).meta.title
      : input.current.meta.title) || "Untitled form";

  const normalized = normalizeAiDefinition(plan.definition, title);
  // Keep designer theme; AI edits fields/meta/settings only.
  const definition: FormDefinition = {
    ...normalized,
    theme: input.current.theme ?? normalized.theme,
  };

  return {
    kind: "update",
    reply: plan.reply,
    definition,
    fieldCount: definition.fields.length,
  };
}
