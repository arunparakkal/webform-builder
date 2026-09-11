import type { FormDefinition } from "@webform/form-schema";
import { create } from "zustand";

type EditorState = {
  formId: string | null;
  title: string;
  slug: string;
  definition: FormDefinition | null;
  selectedFieldId: string | null;
  dirty: boolean;
  setMeta: (patch: { title?: string; slug?: string }) => void;
  setDefinition: (definition: FormDefinition) => void;
  selectField: (id: string | null) => void;
  load: (payload: {
    formId: string;
    title: string;
    slug: string;
    definition: FormDefinition;
  }) => void;
  markClean: () => void;
  reset: () => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  formId: null,
  title: "",
  slug: "",
  definition: null,
  selectedFieldId: null,
  dirty: false,
  setMeta: (patch) =>
    set((state) => ({
      title: patch.title ?? state.title,
      slug: patch.slug ?? state.slug,
      dirty: true,
      definition:
        patch.title !== undefined && state.definition
          ? {
              ...state.definition,
              meta: { ...state.definition.meta, title: patch.title },
            }
          : state.definition,
    })),
  setDefinition: (definition) => set({ definition, dirty: true }),
  selectField: (selectedFieldId) => set({ selectedFieldId }),
  load: ({ formId, title, slug, definition }) =>
    set({
      formId,
      title,
      slug,
      definition,
      selectedFieldId: definition.fields[0]?.id ?? null,
      dirty: false,
    }),
  markClean: () => set({ dirty: false }),
  reset: () =>
    set({
      formId: null,
      title: "",
      slug: "",
      definition: null,
      selectedFieldId: null,
      dirty: false,
    }),
}));
