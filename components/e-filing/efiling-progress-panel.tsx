'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Circle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface FieldEvent {
  type: 'field';
  fieldName: string;
  fieldPath?: string;
  status: 'filled' | 'skipped' | 'failed';
  value?: string;
  reason?: string;
}

interface ProgressEvent {
  type: 'status' | 'field' | 'complete' | 'error';
  step?: string;
  fieldName?: string;
  fieldPath?: string;
  status?: string;
  value?: string;
  reason?: string;
  fieldsAttempted?: number;
  fieldsFilled?: number;
  fieldsSkipped?: number;
  fieldsFailed?: number;
  message?: string;
}

type StepStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'waiting'
  | 'skipped';

interface EFilingProgressPanelProps {
  open: boolean;
  onClose: () => void;
  caseFormId: number;
}

type ExtensionStepId =
  | 'prepare'
  | 'send_to_extension'
  | 'waiting_login'
  | 'extracting'
  | 'mapping'
  | 'filling'
  | 'done';

const ALL_STEPS: ExtensionStepId[] = [
  'prepare',
  'send_to_extension',
  'waiting_login',
  'extracting',
  'mapping',
  'filling',
  'done',
];

export function EFilingProgressPanel({
  open,
  onClose,
  caseFormId,
}: EFilingProgressPanelProps) {
  const t = useTranslations('dashboard.efiling');
  const [stepStatuses, setStepStatuses] = useState<
    Record<string, { status: StepStatus; message: string }>
  >({});
  const [fields, setFields] = useState<FieldEvent[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [complete, setComplete] = useState<ProgressEvent | null>(null);
  const [showFields, setShowFields] = useState(false);
  const startedRef = useRef(false);

  const handleProgressEvent = useCallback((event: ProgressEvent) => {
    switch (event.type) {
      case 'status': {
        if (event.step) {
          setStepStatuses((prev) => ({
            ...prev,
            [event.step!]: {
              status: 'in_progress' as StepStatus,
              message: event.message || '',
            },
          }));
        }
        break;
      }
      case 'field': {
        if (event.fieldName) {
          setFields((prev) => [
            ...prev,
            {
              type: 'field',
              fieldName: event.fieldName!,
              fieldPath: event.fieldPath,
              status:
                (event.status as 'filled' | 'skipped' | 'failed') || 'skipped',
              value: event.value,
              reason: event.reason,
            },
          ]);
        }
        break;
      }
      case 'complete': {
        setComplete(event);
        setStepStatuses((prev) => ({
          ...prev,
          filling: { status: 'completed', message: event.message || 'Done' },
          done: { status: 'completed', message: event.message || 'Done' },
        }));
        break;
      }
      case 'error': {
        setErrors((prev) => [...prev, event.message || 'Unknown error']);
        break;
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    if (!startedRef.current) {
      startedRef.current = true;

      // Mark initial steps as complete (they happened before panel opened)
      setStepStatuses({
        prepare: { status: 'completed', message: 'Data prepared' },
        send_to_extension: {
          status: 'completed',
          message: 'Sent to extension',
        },
        waiting_login: {
          status: 'in_progress',
          message: 'Waiting for USCIS login...',
        },
      });
    }

    // Listen for progress events from the extension (via ezmig-bridge.ts)
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail) {
        handleProgressEvent(detail as ProgressEvent);
      }
    };

    window.addEventListener('ezmig:filling-progress', handler);

    return () => {
      window.removeEventListener('ezmig:filling-progress', handler);
    };
  }, [open, handleProgressEvent]);

  const handleClose = () => {
    startedRef.current = false;
    setStepStatuses({});
    setFields([]);
    setErrors([]);
    setComplete(null);
    onClose();
  };

  const filledCount = fields.filter((f) => f.status === 'filled').length;
  const skippedCount = fields.filter((f) => f.status === 'skipped').length;
  const failedCount = fields.filter((f) => f.status === 'failed').length;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>{t('panelTitle')}</SheetTitle>
          <SheetDescription>
            {complete ? t('reviewMessage') : t('panelDescription')}
          </SheetDescription>
        </SheetHeader>

        {/* Steps */}
        <div className="px-4 space-y-2">
          {ALL_STEPS.map((stepId) => {
            const info = stepStatuses[stepId];
            const status = info?.status || 'pending';
            const message = info?.message || '';

            return (
              <div key={stepId} className="flex items-start gap-3">
                <div className="mt-0.5">{getStepIcon(status)}</div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      status === 'pending' ? 'text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {t(`steps.${stepId}`)}
                  </p>
                  {message && status !== 'pending' && (
                    <p className="text-xs text-gray-500 truncate">{message}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="px-4 space-y-2">
            {errors.map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded-md text-xs bg-red-50 text-red-800 border border-red-200"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        {/* Fields Progress */}
        {fields.length > 0 && (
          <div className="px-4">
            <button
              onClick={() => setShowFields(!showFields)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 w-full"
            >
              {showFields ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span>
                {t('fieldsSummary', {
                  filled: filledCount,
                  skipped: skippedCount,
                  failed: failedCount,
                })}
              </span>
            </button>

            {showFields && (
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                {fields.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs py-0.5"
                  >
                    {f.status === 'filled' && (
                      <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    )}
                    {f.status === 'skipped' && (
                      <Circle className="h-3 w-3 text-yellow-500 shrink-0" />
                    )}
                    {f.status === 'failed' && (
                      <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                    )}
                    <span className="text-gray-700 truncate">
                      {f.fieldName}
                    </span>
                    {f.value && f.status === 'filled' && (
                      <span className="text-gray-400 ml-auto shrink-0">
                        {f.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Complete Summary */}
        {complete && (
          <div className="px-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-sm">
              <p className="font-medium text-emerald-800">
                {t('completeSummary', {
                  filled: complete.fieldsFilled || 0,
                  total: complete.fieldsAttempted || 0,
                  duration: 0,
                })}
              </p>
            </div>
          </div>
        )}

        {/* Close button */}
        <div className="px-4 pb-4">
          <Button variant="outline" className="w-full" onClick={handleClose}>
            {complete ? t('closeButton') : t('stopButton')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getStepIcon(status: StepStatus) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'in_progress':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'waiting':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'skipped':
      return <Circle className="h-4 w-4 text-gray-300" />;
    default:
      return <Circle className="h-4 w-4 text-gray-300" />;
  }
}
