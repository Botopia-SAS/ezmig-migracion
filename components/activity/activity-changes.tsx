'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityChangesProps {
  changes: Record<string, { old: unknown; new: unknown }>;
  className?: string;
}

const fieldLabels: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  status: 'Status',
  priority: 'Priority',
  assignedTo: 'Assigned To',
  caseType: 'Case Type',
  filingDeadline: 'Filing Deadline',
  currentStatus: 'Immigration Status',
  alienNumber: 'Alien Number',
  uscisReceiptNumber: 'USCIS Receipt #',
  internalNotes: 'Notes',
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function ActivityChanges({ changes, className }: ActivityChangesProps) {
  const entries = Object.entries(changes);

  if (entries.length === 0) return null;

  return (
    <div className={cn('space-y-1.5 text-sm', className)}>
      {entries.map(([field, { old: oldValue, new: newValue }]) => (
        <div key={field} className="flex items-center gap-2 text-muted-foreground">
          <span className="font-medium text-foreground">
            {fieldLabels[field] || field}:
          </span>
          <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-xs line-through">
            {formatValue(oldValue)}
          </span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs">
            {formatValue(newValue)}
          </span>
        </div>
      ))}
    </div>
  );
}
