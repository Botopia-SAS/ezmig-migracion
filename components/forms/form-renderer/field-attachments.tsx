'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Paperclip, X, FileText, ImageIcon, File, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FieldEvidence } from '@/hooks/use-field-evidences';

interface FieldAttachmentsProps {
  caseId: number;
  caseFormId: number;
  fieldPath: string;
  evidences: FieldEvidence[];
  onUploadComplete: () => void;
  onDelete: (evidenceId: number) => void;
  disabled?: boolean;
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

function isImage(fileType: string | null): boolean {
  if (!fileType) return false;
  return IMAGE_EXTENSIONS.includes(fileType.toLowerCase());
}

function FileIcon({ fileType }: { fileType: string | null }) {
  if (isImage(fileType)) return <ImageIcon className="h-4 w-4 text-blue-400" />;
  if (fileType === 'pdf') return <FileText className="h-4 w-4 text-red-400" />;
  return <File className="h-4 w-4 text-gray-400" />;
}

export function FieldAttachments({
  caseId,
  caseFormId,
  fieldPath,
  evidences,
  onUploadComplete,
  onDelete,
  disabled,
}: FieldAttachmentsProps) {
  const t = useTranslations('dashboard.forms.renderer.attachments');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('caseId', caseId.toString());
        formData.append('caseFormId', caseFormId.toString());
        formData.append('fieldPath', fieldPath);

        const res = await fetch('/api/evidences/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
      }
      onUploadComplete();
      toast.success(t('uploaded'));
    } catch {
      toast.error(t('uploadError'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleDelete(evidenceId: number) {
    onDelete(evidenceId);
    toast.success(t('deleted'));
  }

  return (
    <div className="mt-1.5">
      {/* Existing attachments */}
      {evidences.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {evidences.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-xs group"
            >
              {isImage(ev.fileType) ? (
                <img
                  src={ev.fileUrl}
                  alt={ev.fileName}
                  className="h-6 w-6 rounded object-cover"
                />
              ) : (
                <FileIcon fileType={ev.fileType} />
              )}
              <a
                href={ev.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-violet-600 max-w-[150px] truncate"
              >
                {ev.fileName}
              </a>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleDelete(ev.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {!disabled && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files); }}
            disabled={isUploading}
            className={`inline-flex items-center gap-1 text-xs transition-colors ${
              isDragOver
                ? 'text-violet-600'
                : 'text-gray-400 hover:text-violet-600'
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Paperclip className="h-3 w-3" />
            )}
            {isUploading ? t('uploading') : t('attach')}
          </button>
        </>
      )}
    </div>
  );
}
