'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function NewFormPage() {
  const t = useTranslations('admin.forms');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      category: (formData.get('category') as string) || undefined,
      uscisEdition: (formData.get('uscisEdition') as string) || undefined,
      tokenCost: parseInt(formData.get('tokenCost') as string) || 1,
      estimatedTimeMinutes: parseInt(formData.get('estimatedTimeMinutes') as string) || undefined,
    };

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tokenCost">{t('fields.tokenCost')}</Label>
                <Input
                  id="tokenCost"
                  name="tokenCost"
                  type="number"
                  min={0}
                  defaultValue={1}
                />
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
