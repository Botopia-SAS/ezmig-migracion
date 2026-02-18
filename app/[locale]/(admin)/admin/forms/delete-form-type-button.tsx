'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  formTypeId: number;
  formCode: string;
  caseFormCount: number;
}

export function DeleteFormTypeButton({ formTypeId, formCode, caseFormCount }: Props) {
  const t = useTranslations('admin.forms');
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/form-types/${formTypeId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Error deleting form type');
        return;
      }

      router.refresh();
    } catch {
      alert('Error deleting form type');
    } finally {
      setIsDeleting(false);
    }
  }

  const willDeactivate = caseFormCount > 0;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={t('actions.delete')}
          className="text-gray-700 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {willDeactivate ? t('deleteConfirm.deactivateTitle') : t('deleteConfirm.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {willDeactivate
              ? t('deleteConfirm.messageWithCases', { name: formCode, count: caseFormCount })
              : t('deleteConfirm.message', { name: formCode })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className={willDeactivate ? '' : 'bg-red-600 hover:bg-red-700'}
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {willDeactivate ? t('deleteConfirm.deactivate') : t('deleteConfirm.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
