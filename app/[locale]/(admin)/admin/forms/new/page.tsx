'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Upload, FileText, X, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function NewFormPage() {
  const t = useTranslations('admin.forms');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchema, setGeneratedSchema] = useState<object | null>(null);
  const [genStatus, setGenStatus] = useState('');
  const [genProgress, setGenProgress] = useState<{ chars: number; tokens: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const pdfs = files.filter((f) => f.type === 'application/pdf');
    setPdfFiles((prev) => [...prev, ...pdfs]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeFile(index: number) {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
    setGeneratedSchema(null);
  }

  async function handleGenerateFromPDF(formCode: string) {
    if (!pdfFiles.length || !formCode) return;

    setIsGenerating(true);
    setGenStatus('Uploading PDF...');
    setGenProgress(null);
    setGeneratedSchema(null);

    try {
      const formData = new FormData();
      formData.append('formCode', formCode);
      pdfFiles.forEach((f) => formData.append('pdfs', f));

      const res = await fetch('/api/admin/form-types/generate-from-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        // Non-SSE error (validation errors return JSON)
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const err = await res.json();
          alert(err.error || 'Error generating schema from PDF');
        } else {
          alert('Error generating schema from PDF');
        }
        return;
      }

      // Read the SSE stream
      const reader = res.body?.getReader();
      if (!reader) { alert('No response stream'); return; }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (currentEvent === 'status') {
              setGenStatus(data.message);
            } else if (currentEvent === 'progress') {
              setGenProgress(data);
            } else if (currentEvent === 'done') {
              setGeneratedSchema(data.schema);
              setGenStatus('');
            } else if (currentEvent === 'error') {
              alert(data.message);
            }
          }
        }
      }
    } catch {
      alert('Error generating schema from PDF');
    } finally {
      setIsGenerating(false);
      setGenStatus('');
      setGenProgress(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      category: (formData.get('category') as string) || undefined,
      uscisEdition: (formData.get('uscisEdition') as string) || undefined,
      estimatedTimeMinutes: parseInt(formData.get('estimatedTimeMinutes') as string) || undefined,
    };

    // If we have a generated schema, include it
    if (generatedSchema) {
      data.formSchema = generatedSchema;
    }

    try {
      const res = await fetch('/api/admin/form-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Error creating form type');
        setIsSubmitting(false);
        return;
      }

      const created = await res.json();
      router.push(`/admin/forms/${created.id}/builder`);
    } catch {
      alert('Error creating form type');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/forms">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('create.title')}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t('fields.code')}</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder={t('fields.codePlaceholder')}
                  required
                  className="uppercase"
                />
                <p className="text-xs text-gray-500">{t('fields.codeHelp')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t('fields.name')}</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder={t('fields.namePlaceholder')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('fields.description')}</Label>
              <Textarea
                id="description"
                name="description"
                placeholder={t('fields.descriptionPlaceholder')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t('fields.category')}</Label>
                <Select name="category">
                  <SelectTrigger>
                    <SelectValue placeholder={t('fields.categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">{t('categories.family')}</SelectItem>
                    <SelectItem value="employment">{t('categories.employment')}</SelectItem>
                    <SelectItem value="humanitarian">{t('categories.humanitarian')}</SelectItem>
                    <SelectItem value="naturalization">{t('categories.naturalization')}</SelectItem>
                    <SelectItem value="other">{t('categories.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="uscisEdition">{t('fields.uscisEdition')}</Label>
                <Input
                  id="uscisEdition"
                  name="uscisEdition"
                  placeholder={t('fields.uscisEditionPlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedTimeMinutes">{t('fields.estimatedTime')}</Label>
              <Input
                id="estimatedTimeMinutes"
                name="estimatedTimeMinutes"
                type="number"
                min={0}
              />
            </div>

            {/* PDF Upload Section */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <Label className="text-base font-semibold">{t('create.aiGenerate')}</Label>
              </div>
              <p className="text-sm text-gray-500 mb-4">{t('create.aiGenerateDescription')}</p>

              <button
                type="button"
                className="w-full border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-violet-300 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{t('create.uploadPdf')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('create.uploadPdfHint')}</p>
              </button>

              {pdfFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {pdfFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2"
                    >
                      <FileText className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    disabled={isGenerating}
                    onClick={() => {
                      const codeInput = document.getElementById('code') as HTMLInputElement;
                      const code = codeInput?.value;
                      if (!code) {
                        alert(t('create.codeRequiredForAI'));
                        codeInput?.focus();
                        return;
                      }
                      handleGenerateFromPDF(code);
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('create.generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t('create.generateSchema')}
                      </>
                    )}
                  </Button>

                  {isGenerating && genStatus && (
                    <div className="bg-violet-50 border border-violet-200 rounded-md p-3 mt-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600 shrink-0" />
                        <p className="text-sm text-violet-700">{genStatus}</p>
                      </div>
                      {genProgress && (
                        <p className="text-xs text-violet-500 mt-1 ml-5.5">
                          {genProgress.chars.toLocaleString()} chars generated
                        </p>
                      )}
                    </div>
                  )}

                  {generatedSchema && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2">
                      <p className="text-sm text-green-700 font-medium">
                        {t('create.schemaGenerated')}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {t('create.schemaGeneratedHint')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('create.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
