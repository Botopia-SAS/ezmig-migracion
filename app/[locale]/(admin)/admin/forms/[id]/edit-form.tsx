'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { FormType } from '@/lib/db/schema';

interface Props {
  formType: FormType;
}

export function FormTypeEditForm({ formType }: Props) {
  const t = useTranslations('admin.forms');
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      category: (formData.get('category') as string) || undefined,
      uscisEdition: (formData.get('uscisEdition') as string) || undefined,
      estimatedTimeMinutes: parseInt(formData.get('estimatedTimeMinutes') as string) || undefined,
    };

    try {
      const res = await fetch(`/api/admin/form-types/${formType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Error updating form type');
      } else {
        router.refresh();
      }
    } catch {
      alert('Error updating form type');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">{t('fields.code')}</Label>
          <Input id="code" value={formType.code} disabled className="uppercase bg-gray-50" />
          <p className="text-xs text-gray-500">{t('fields.codeHelp')}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">{t('fields.name')}</Label>
          <Input
            id="name"
            name="name"
            defaultValue={formType.name}
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
          defaultValue={formType.description || ''}
          placeholder={t('fields.descriptionPlaceholder')}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">{t('fields.category')}</Label>
          <Select name="category" defaultValue={formType.category || ''}>
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
            defaultValue={formType.uscisEdition || ''}
            placeholder={t('fields.uscisEditionPlaceholder')}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimatedTimeMinutes">{t('fields.estimatedTime')}</Label>
          <Input
            id="estimatedTimeMinutes"
            name="estimatedTimeMinutes"
            type="number"
            min={0}
            defaultValue={formType.estimatedTimeMinutes || ''}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t('editMeta.save')}
        </Button>
      </div>
    </form>
  );
}
