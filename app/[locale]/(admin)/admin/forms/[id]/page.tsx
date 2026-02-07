export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Blocks, Eye } from 'lucide-react';
import { getFormTypeByIdAdmin } from '@/lib/admin/form-types-service';
import { FormTypeEditForm } from './edit-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFormTypePage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations('admin.forms');
  const formType = await getFormTypeByIdAdmin(parseInt(id, 10));

  if (!formType) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/forms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('editMeta.title')}: {formType.code}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/forms/${formType.id}/preview`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              {t('editMeta.openPreview')}
            </Button>
          </Link>
          <Link href={`/admin/forms/${formType.id}/builder`}>
            <Button size="sm">
              <Blocks className="h-4 w-4 mr-2" />
              {t('editMeta.openBuilder')}
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FormTypeEditForm formType={formType} />
        </CardContent>
      </Card>
    </div>
  );
}
