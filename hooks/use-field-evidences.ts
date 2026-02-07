'use client';

import useSWR from 'swr';

export interface FieldEvidence {
  id: number;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  fileUrl: string;
  fieldPath: string | null;
  validationStatus: string;
  uploadedAt: string;
}

interface EvidencesResponse {
  evidences: (FieldEvidence & Record<string, unknown>)[];
  total: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useFieldEvidences(caseId: number, caseFormId: number) {
  const { data, mutate, isLoading } = useSWR<EvidencesResponse>(
    caseId > 0 && caseFormId > 0
      ? `/api/evidences?caseId=${caseId}&caseFormId=${caseFormId}`
      : null,
    fetcher
  );

  function getForField(fieldPath: string): FieldEvidence[] {
    if (!data?.evidences) return [];
    return data.evidences.filter((ev) => ev.fieldPath === fieldPath);
  }

  async function removeEvidence(evidenceId: number) {
    await fetch(`/api/evidences/${evidenceId}`, { method: 'DELETE' });
    mutate();
  }

  return {
    getForField,
    removeEvidence,
    refresh: mutate,
    isLoading,
  };
}
