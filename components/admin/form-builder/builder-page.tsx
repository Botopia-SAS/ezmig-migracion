'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useFormBuilderStore } from '@/lib/stores/form-builder-store';
import { useTemporalStore } from '@/lib/stores/form-builder-store-temporal';
import { useSidebar } from '@/components/ui/sidebar';
import { BuilderHeaderPortal } from './builder-header-portal';
import { OutlineTree } from './outline-tree';
import { Canvas } from './canvas';
import { PropertiesPanel } from './properties-panel';
import { AddElementDialogProvider } from './add-element-dialog-provider';
import type { FormSchema } from '@/lib/forms/service';

interface Props {
  formTypeId: number;
  formCode: string;
  initialSchema: FormSchema;
}

export function BuilderPage({ formTypeId, formCode, initialSchema }: Props) {
  const setSchema = useFormBuilderStore((s) => s.setSchema);
  const schema = useFormBuilderStore((s) => s.schema);
  const isDirty = useFormBuilderStore((s) => s.isDirty);
  const markSaved = useFormBuilderStore((s) => s.markSaved);
  const setIsSaving = useFormBuilderStore((s) => s.setIsSaving);
  const { clear } = useTemporalStore();

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setOpen } = useSidebar();

  // Collapse the admin sidebar so the 3-panel builder has full width
  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  // Initialize store with schema from DB
  useEffect(() => {
    setSchema(initialSchema, formTypeId);
    clear();
  }, [initialSchema, formTypeId, setSchema, clear]);

  // Save function
  const save = useCallback(async () => {
    const currentSchema = useFormBuilderStore.getState().schema;
    const currentDirty = useFormBuilderStore.getState().isDirty;
    if (!currentDirty) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/form-types/${formTypeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formSchema: currentSchema }),
      });
      if (res.ok) {
        markSaved();
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [formTypeId, markSaved, setIsSaving]);

  // Auto-save on dirty (3s debounce)
  useEffect(() => {
    if (!isDirty) return;

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(() => {
      save();
    }, 3000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [isDirty, schema, save]);

  // Keyboard shortcuts (Ctrl+S to save, Ctrl+Z undo, Ctrl+Shift+Z redo)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 's') {
        e.preventDefault();
        save();
      }
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useFormBuilderStore.temporal.getState().undo();
      }
      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        useFormBuilderStore.temporal.getState().redo();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save]);

  // Warn on navigation away if dirty
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (useFormBuilderStore.getState().isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <AddElementDialogProvider>
      <BuilderHeaderPortal
        formTypeId={formTypeId}
        formCode={formCode}
        onSave={save}
      />
      <div className="-m-4 lg:-m-6 flex h-[calc(100vh-3rem)] overflow-hidden">
        <OutlineTree />
        <Canvas />
        <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto shrink-0">
          <PropertiesPanel />
        </div>
      </div>
    </AddElementDialogProvider>
  );
}
