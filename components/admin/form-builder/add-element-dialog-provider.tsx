'use client';

import { createContext, useContext, useCallback, useState } from 'react';
import { AddElementDialog, type AddElementType } from './add-element-dialog';
import { useFormBuilderStore } from '@/lib/stores/form-builder-store';
import type { FormField } from '@/lib/forms/service';

interface DialogRequest {
  open: boolean;
  elementType: AddElementType;
  fieldType?: FormField['type'];
  partId?: string;
  sectionId?: string;
}

interface AddElementDialogContextType {
  requestAddPart: () => void;
  requestAddSection: (partId: string) => void;
  requestAddField: (partId: string, sectionId: string, fieldType: FormField['type']) => void;
}

const AddElementDialogContext = createContext<AddElementDialogContextType | null>(null);

export function useAddElementDialogContext() {
  const ctx = useContext(AddElementDialogContext);
  if (!ctx) throw new Error('useAddElementDialogContext must be used within AddElementDialogProvider');
  return ctx;
}

export function AddElementDialogProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<DialogRequest>({
    open: false,
    elementType: 'part',
  });

  const addPart = useFormBuilderStore((s) => s.addPart);
  const addSection = useFormBuilderStore((s) => s.addSection);
  const addField = useFormBuilderStore((s) => s.addField);

  const requestAddPart = useCallback(() => {
    setRequest({ open: true, elementType: 'part' });
  }, []);

  const requestAddSection = useCallback((partId: string) => {
    setRequest({ open: true, elementType: 'section', partId });
  }, []);

  const requestAddField = useCallback(
    (partId: string, sectionId: string, fieldType: FormField['type']) => {
      setRequest({ open: true, elementType: 'field', partId, sectionId, fieldType });
    },
    []
  );

  const handleConfirm = useCallback(
    (values: { en: string; es: string; pt: string }) => {
      if (request.elementType === 'part') {
        addPart({
          title: values.en,
          translations: {
            es: { title: values.es },
            pt: { title: values.pt },
          },
        });
      } else if (request.elementType === 'section' && request.partId) {
        addSection(request.partId, {
          title: values.en,
          translations: {
            es: { title: values.es },
            pt: { title: values.pt },
          },
        });
      } else if (
        request.elementType === 'field' &&
        request.partId &&
        request.sectionId &&
        request.fieldType
      ) {
        addField(request.partId, request.sectionId, request.fieldType, {
          label: values.en,
          translations: {
            es: { label: values.es },
            pt: { label: values.pt },
          },
        });
      }
    },
    [request, addPart, addSection, addField]
  );

  return (
    <AddElementDialogContext.Provider
      value={{ requestAddPart, requestAddSection, requestAddField }}
    >
      {children}
      <AddElementDialog
        open={request.open}
        onOpenChange={(open) => setRequest((prev) => ({ ...prev, open }))}
        elementType={request.elementType}
        fieldType={request.fieldType}
        onConfirm={handleConfirm}
      />
    </AddElementDialogContext.Provider>
  );
}
