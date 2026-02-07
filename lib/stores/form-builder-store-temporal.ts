import { useFormBuilderStore } from './form-builder-store';
import { useStore } from 'zustand';

/**
 * Hook to access the temporal (undo/redo) store from zundo.
 */
export function useTemporalStore() {
  const store = useFormBuilderStore.temporal;
  const pastStates = useStore(store, (s) => s.pastStates);
  const futureStates = useStore(store, (s) => s.futureStates);
  const undo = useStore(store, (s) => s.undo);
  const redo = useStore(store, (s) => s.redo);
  const clear = useStore(store, (s) => s.clear);

  return { pastStates, futureStates, undo, redo, clear };
}
