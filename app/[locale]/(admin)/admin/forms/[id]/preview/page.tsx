export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getFormTypeByIdAdmin } from '@/lib/admin/form-types-service';
import { PreviewClient } from './preview-client';
import type { FormSchema } from '@/lib/forms/service';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PageProps) {
  const { id } = await params;
  const formType = await getFormTypeByIdAdmin(parseInt(id, 10));

  if (!formType) {
    notFound();
  }

  const schema = formType.formSchema as FormSchema;

  return <PreviewClient schema={schema} formCode={formType.code} formTypeId={formType.id} />;
}
