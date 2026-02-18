export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Plus,
  Pencil,
  Blocks,
  Eye,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getAllFormTypes } from '@/lib/admin/form-types-service';
import { DeleteFormTypeButton } from './delete-form-type-button';

export default async function FormsPage() {
  const t = await getTranslations('admin.forms');
  const formTypesList = await getAllFormTypes();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('description')}</p>
        </div>
        <Link href="/admin/forms/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('newForm')}
          </Button>
        </Link>
      </div>

      {formTypesList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">{t('empty')}</p>
            <Link href="/admin/forms/new" className="mt-4">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {t('newForm')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  {t('columns.code')}
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  {t('columns.name')}
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  {t('columns.category')}
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  {t('columns.edition')}
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  {t('columns.status')}
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  {t('columns.caseForms')}
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  {t('columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {formTypesList.map((ft) => (
                <tr
                  key={ft.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${!ft.isActive ? 'opacity-50' : ''}`}
                >
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm font-semibold text-violet-700">
                      {ft.code}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">{ft.name}</td>
                  <td className="py-3 px-4">
                    {ft.category && (
                      <Badge variant="secondary" className="text-xs">
                        {ft.category}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {ft.uscisEdition || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={ft.isActive ? 'success' : 'secondary'}>
                      {ft.isActive ? t('status.active') : t('status.inactive')}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {ft.caseFormCount}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/forms/${ft.id}`}>
                        <Button variant="ghost" size="icon" title={t('actions.edit')} className="text-gray-700 hover:text-gray-900">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/forms/${ft.id}/builder`}>
                        <Button variant="ghost" size="icon" title={t('actions.builder')} className="text-gray-700 hover:text-gray-900">
                          <Blocks className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/forms/${ft.id}/preview`}>
                        <Button variant="ghost" size="icon" title={t('actions.preview')} className="text-gray-700 hover:text-gray-900">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteFormTypeButton
                        formTypeId={ft.id}
                        formCode={ft.code}
                        caseFormCount={ft.caseFormCount}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
