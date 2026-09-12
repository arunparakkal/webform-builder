import { DEFAULT_FORM_THEME, type FormDefinition, type FormField, type FormTheme } from "@webform/form-schema";
import { THEME_PRESETS } from "./formThemes";

export type FormTemplateCategory =
  | "HR"
  | "Support"
  | "Marketing"
  | "Events"
  | "Product"
  | "General";

export type FormTemplate = {
  id: string;
  title: string;
  slugBase: string;
  description: string;
  category: FormTemplateCategory;
  accent: string;
  fieldCount: number;
  definition: FormDefinition;
};

function opt(label: string, value: string) {
  return { id: crypto.randomUUID(), label, value };
}

function field(
  partial: Omit<FormField, "id" | "placeholder" | "helpText" | "validation" | "options" | "visibility"> &
    Partial<Pick<FormField, "placeholder" | "helpText" | "validation" | "options" | "visibility">>,
): FormField {
  return {
    id: crypto.randomUUID(),
    placeholder: partial.placeholder ?? "",
    helpText: partial.helpText ?? "",
    validation: partial.validation ?? {},
    options: partial.options ?? [],
    visibility: partial.visibility ?? { mode: "always" },
    ...partial,
  };
}

function themeFromPreset(presetId: string, overrides?: Partial<FormTheme>): FormTheme {
  const preset = THEME_PRESETS.find((p) => p.id === presetId) ?? THEME_PRESETS[0];
  return {
    ...DEFAULT_FORM_THEME,
    presetId: preset.id,
    colors: { ...preset.colors },
    ...overrides,
  };
}

function buildDefinition(input: {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  theme: FormTheme;
  fields: FormField[];
}): FormDefinition {
  return {
    schemaVersion: 1,
    meta: {
      title: input.title,
      description: input.description,
    },
    settings: {
      submitLabel: input.submitLabel,
      successMessage: input.successMessage,
    },
    theme: input.theme,
    fields: input.fields,
  };
}

function makeTemplates(): FormTemplate[] {
  const contactFields = [
    field({ type: "text", name: "full_name", label: "Full name", required: true, placeholder: "Jane Doe" }),
    field({ type: "email", name: "email", label: "Work email", required: true, placeholder: "jane@company.com" }),
    field({
      type: "select",
      name: "topic",
      label: "Topic",
      required: true,
      options: [opt("Sales", "sales"), opt("Support", "support"), opt("Partnership", "partnership")],
    }),
    field({
      type: "textarea",
      name: "message",
      label: "How can we help?",
      required: true,
      placeholder: "Tell us a bit about your request…",
      validation: { minLength: 10, maxLength: 2000 },
    }),
  ];

  const leaveFields = [
    field({ type: "text", name: "employee_name", label: "Employee name", required: true }),
    field({ type: "email", name: "email", label: "Email", required: true }),
    field({
      type: "select",
      name: "leave_type",
      label: "Leave type",
      required: true,
      options: [
        opt("Annual leave", "annual"),
        opt("Sick leave", "sick"),
        opt("Personal", "personal"),
        opt("Unpaid", "unpaid"),
      ],
    }),
    field({ type: "date", name: "start_date", label: "Start date", required: true }),
    field({ type: "date", name: "end_date", label: "End date", required: true }),
    field({
      type: "textarea",
      name: "reason",
      label: "Reason (optional)",
      required: false,
      placeholder: "Optional note for your manager",
    }),
  ];

  const feedbackFields = [
    field({ type: "text", name: "name", label: "Your name", required: false }),
    field({ type: "email", name: "email", label: "Email", required: false }),
    field({
      type: "radio",
      name: "rating",
      label: "Overall rating",
      required: true,
      options: [
        opt("Excellent", "5"),
        opt("Good", "4"),
        opt("Okay", "3"),
        opt("Poor", "2"),
        opt("Bad", "1"),
      ],
    }),
    field({
      type: "textarea",
      name: "feedback",
      label: "What should we improve?",
      required: true,
      validation: { minLength: 5 },
    }),
  ];

  const rsvpFields = [
    field({ type: "text", name: "guest_name", label: "Guest name", required: true }),
    field({ type: "email", name: "email", label: "Email", required: true }),
    field({
      type: "radio",
      name: "attendance",
      label: "Will you attend?",
      required: true,
      options: [opt("Yes", "yes"), opt("No", "no"), opt("Maybe", "maybe")],
    }),
    field({
      type: "number",
      name: "guests",
      label: "Number of guests",
      required: true,
      validation: { min: 1, max: 10 },
      visibility: { mode: "when", fieldId: "", operator: "eq", value: "yes" },
    }),
    field({
      type: "select",
      name: "meal",
      label: "Meal preference",
      required: false,
      options: [opt("Standard", "standard"), opt("Vegetarian", "veg"), opt("Vegan", "vegan")],
    }),
  ];
  // Wire conditional guests field to attendance
  const attendanceId = rsvpFields[2].id;
  rsvpFields[3].visibility = { mode: "when", fieldId: attendanceId, operator: "eq", value: "yes" };

  const jobFields = [
    field({ type: "text", name: "full_name", label: "Full name", required: true }),
    field({ type: "email", name: "email", label: "Email", required: true }),
    field({ type: "text", name: "phone", label: "Phone", required: true, placeholder: "+1 555 0100" }),
    field({
      type: "select",
      name: "role",
      label: "Role you're applying for",
      required: true,
      options: [
        opt("Frontend engineer", "frontend"),
        opt("Backend engineer", "backend"),
        opt("Product designer", "design"),
        opt("Other", "other"),
      ],
    }),
    field({
      type: "textarea",
      name: "experience",
      label: "Relevant experience",
      required: true,
      placeholder: "A short summary of your background…",
    }),
    field({
      type: "textarea",
      name: "portfolio",
      label: "Portfolio / LinkedIn",
      required: false,
      placeholder: "https://…",
    }),
  ];

  const newsletterFields = [
    field({ type: "text", name: "first_name", label: "First name", required: true }),
    field({ type: "email", name: "email", label: "Email", required: true }),
    field({
      type: "checkbox",
      name: "interests",
      label: "Interests",
      required: false,
      options: [
        opt("Product updates", "product"),
        opt("Tips & tutorials", "tips"),
        opt("Company news", "news"),
      ],
    }),
  ];

  const bugFields = [
    field({ type: "text", name: "title", label: "Bug title", required: true }),
    field({ type: "email", name: "email", label: "Your email", required: true }),
    field({
      type: "select",
      name: "severity",
      label: "Severity",
      required: true,
      options: [opt("Critical", "critical"), opt("High", "high"), opt("Medium", "medium"), opt("Low", "low")],
    }),
    field({
      type: "textarea",
      name: "steps",
      label: "Steps to reproduce",
      required: true,
      placeholder: "1. …\n2. …\n3. …",
    }),
    field({
      type: "textarea",
      name: "expected",
      label: "Expected vs actual",
      required: true,
    }),
  ];

  const supportFields = [
    field({ type: "text", name: "name", label: "Name", required: true }),
    field({ type: "email", name: "email", label: "Email", required: true }),
    field({
      type: "select",
      name: "category",
      label: "Issue category",
      required: true,
      options: [
        opt("Account", "account"),
        opt("Billing", "billing"),
        opt("Technical", "technical"),
        opt("Other", "other"),
      ],
    }),
    field({
      type: "radio",
      name: "priority",
      label: "Priority",
      required: true,
      options: [opt("Low", "low"), opt("Normal", "normal"), opt("Urgent", "urgent")],
    }),
    field({
      type: "textarea",
      name: "details",
      label: "Describe the issue",
      required: true,
      validation: { minLength: 20 },
    }),
  ];

  const defs: Array<Omit<FormTemplate, "fieldCount" | "definition"> & { definition: FormDefinition }> = [
    {
      id: "contact",
      title: "Contact us",
      slugBase: "contact",
      description: "Classic inbound contact form with topic routing.",
      category: "General",
      accent: "#2563EB",
      definition: buildDefinition({
        title: "Contact us",
        description: "We usually reply within one business day.",
        submitLabel: "Send message",
        successMessage: "Thanks — we got your message and will reply soon.",
        theme: themeFromPreset("ocean"),
        fields: contactFields,
      }),
    },
    {
      id: "leave-request",
      title: "Leave request",
      slugBase: "leave-request",
      description: "HR leave form with dates and leave type.",
      category: "HR",
      accent: "#0D9488",
      definition: buildDefinition({
        title: "Leave request",
        description: "Submit time-off for manager approval.",
        submitLabel: "Submit request",
        successMessage: "Your leave request was submitted.",
        theme: themeFromPreset("forest", { align: "left" }),
        fields: leaveFields,
      }),
    },
    {
      id: "customer-feedback",
      title: "Customer feedback",
      slugBase: "customer-feedback",
      description: "Collect ratings and open-ended product feedback.",
      category: "Product",
      accent: "#EA580C",
      definition: buildDefinition({
        title: "Customer feedback",
        description: "Help us improve — it only takes a minute.",
        submitLabel: "Share feedback",
        successMessage: "Thank you for your feedback!",
        theme: themeFromPreset("sunset"),
        fields: feedbackFields,
      }),
    },
    {
      id: "event-rsvp",
      title: "Event RSVP",
      slugBase: "event-rsvp",
      description: "RSVP with attendance and meal preference.",
      category: "Events",
      accent: "#7C3AED",
      definition: buildDefinition({
        title: "Event RSVP",
        description: "Let us know if you can make it.",
        submitLabel: "Confirm RSVP",
        successMessage: "You're on the list — see you there!",
        theme: themeFromPreset("berry", { radius: "xl" }),
        fields: rsvpFields,
      }),
    },
    {
      id: "job-application",
      title: "Job application",
      slugBase: "job-application",
      description: "Lightweight hiring intake for open roles.",
      category: "HR",
      accent: "#1D4ED8",
      definition: buildDefinition({
        title: "Job application",
        description: "Tell us about yourself and the role you want.",
        submitLabel: "Apply now",
        successMessage: "Application received — we'll be in touch.",
        theme: themeFromPreset("classic"),
        fields: jobFields,
      }),
    },
    {
      id: "newsletter",
      title: "Newsletter signup",
      slugBase: "newsletter",
      description: "Short signup with interest checkboxes.",
      category: "Marketing",
      accent: "#0891B2",
      definition: buildDefinition({
        title: "Join our newsletter",
        description: "Product updates and tips — no spam.",
        submitLabel: "Subscribe",
        successMessage: "You're subscribed. Welcome!",
        theme: themeFromPreset("ocean", { buttonWidth: "full" }),
        fields: newsletterFields,
      }),
    },
    {
      id: "bug-report",
      title: "Bug report",
      slugBase: "bug-report",
      description: "Structured bug intake for product teams.",
      category: "Product",
      accent: "#DC2626",
      definition: buildDefinition({
        title: "Bug report",
        description: "Report an issue so we can fix it faster.",
        submitLabel: "Submit bug",
        successMessage: "Bug filed — thanks for helping us improve.",
        theme: themeFromPreset("midnight"),
        fields: bugFields,
      }),
    },
    {
      id: "support-ticket",
      title: "Support ticket",
      slugBase: "support-ticket",
      description: "Customer support form with priority.",
      category: "Support",
      accent: "#2563EB",
      definition: buildDefinition({
        title: "Support ticket",
        description: "Describe your issue and we'll triage it.",
        submitLabel: "Create ticket",
        successMessage: "Ticket created. Our team will follow up.",
        theme: themeFromPreset("classic", { showQuestionNumbers: true }),
        fields: supportFields,
      }),
    },
  ];

  return defs.map((t) => ({
    ...t,
    fieldCount: t.definition.fields.length,
  }));
}

/** Fresh template instances (new field IDs) each call — safe for creating forms. */
export function getFormTemplates(): FormTemplate[] {
  return makeTemplates();
}

export function shuffleTemplates<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function uniqueTemplateSlug(slugBase: string): string {
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${slugBase}-${suffix}`.slice(0, 64);
}
