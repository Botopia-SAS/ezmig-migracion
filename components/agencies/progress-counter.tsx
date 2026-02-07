'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, User, Building, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgencyRegistrationData } from '@/lib/db/schema';

interface ProgressCounterProps {
  data: Partial<AgencyRegistrationData>;
  agencyType: 'law_firm' | 'immigration_services' | null;
  disclaimerAccepted: boolean;
  className?: string;
  showDetails?: boolean;
}

interface FieldGroup {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: Array<{
    key: keyof AgencyRegistrationData;
    label: string;
    required: boolean;
  }>;
}

const fieldGroups: FieldGroup[] = [
  {
    id: 'business',
    title: 'Información Empresarial',
    icon: Building,
    fields: [
      { key: 'legalBusinessName', label: 'Nombre legal del negocio', required: true },
      { key: 'businessEmail', label: 'Email empresarial', required: true },
      { key: 'businessPhone', label: 'Teléfono empresarial', required: true },
      { key: 'businessNameDba', label: 'Nombre comercial (DBA)', required: false },
      { key: 'website', label: 'Sitio web', required: false },
    ]
  },
  {
    id: 'location',
    title: 'Ubicación',
    icon: MapPin,
    fields: [
      { key: 'address', label: 'Dirección', required: true },
      { key: 'city', label: 'Ciudad', required: true },
      { key: 'state', label: 'Estado', required: true },
      { key: 'zipCode', label: 'Código postal', required: true },
    ]
  },
  {
    id: 'owner',
    title: 'Información del Propietario',
    icon: User,
    fields: [
      { key: 'ownerFullName', label: 'Nombre completo', required: true },
      { key: 'ownerEmail', label: 'Email del propietario', required: true },
      { key: 'ownerPosition', label: 'Posición/Título', required: false },
      { key: 'ownerPhone', label: 'Teléfono del propietario', required: false },
    ]
  },
];

export function ProgressCounter({
  data,
  agencyType,
  disclaimerAccepted,
  className,
  showDetails = true
}: ProgressCounterProps) {
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [groupCompletions, setGroupCompletions] = useState<Record<string, { completed: number; total: number; required: number }>>({});

  // Calcular completitud
  useEffect(() => {
    let totalRequired = 0;
    let totalCompleted = 0;
    const newGroupCompletions: Record<string, { completed: number; total: number; required: number }> = {};

    fieldGroups.forEach(group => {
      let groupCompleted = 0;
      let groupRequired = 0;
      let groupTotal = group.fields.length;

      group.fields.forEach(field => {
        if (field.required) {
          groupRequired++;
          totalRequired++;
        }

        const value = data[field.key];
        const isCompleted = value && typeof value === 'string' && value.trim().length > 0;

        if (isCompleted) {
          groupCompleted++;
          if (field.required) {
            totalCompleted++;
          }
        }
      });

      newGroupCompletions[group.id] = {
        completed: groupCompleted,
        total: groupTotal,
        required: groupRequired
      };
    });

    // Agregar disclaimer como campo obligatorio solo para immigration_services
    if (agencyType === 'immigration_services') {
      totalRequired++;
      if (disclaimerAccepted) {
        totalCompleted++;
      }
    }

    const percentage = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;
    setCompletionPercentage(percentage);
    setGroupCompletions(newGroupCompletions);
  }, [data, agencyType, disclaimerAccepted]);

  // Status del progreso
  const getProgressStatus = () => {
    if (completionPercentage >= 100) return 'complete';
    if (completionPercentage >= 70) return 'near-complete';
    if (completionPercentage >= 30) return 'in-progress';
    return 'getting-started';
  };

  const progressStatus = getProgressStatus();

  const statusConfig = {
    'complete': {
      color: 'bg-green-500',
      text: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle2,
      message: '¡Perfecto! Tu perfil está completo'
    },
    'near-complete': {
      color: 'bg-blue-500',
      text: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Clock,
      message: 'Casi terminado, faltan pocos campos'
    },
    'in-progress': {
      color: 'bg-violet-500',
      text: 'text-violet-700',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      icon: Clock,
      message: 'Buen progreso, continúa completando'
    },
    'getting-started': {
      color: 'bg-amber-500',
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: AlertCircle,
      message: 'Completa más campos para mejorar tu perfil'
    }
  };

  const config = statusConfig[progressStatus];
  const StatusIcon = config.icon;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header del progreso */}
      <div className={cn(
        'p-4 rounded-lg border',
        config.bg,
        config.border
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <StatusIcon className={cn('h-5 w-5', config.text)} />
            <h3 className="font-semibold text-gray-900">
              Progreso del Perfil
            </h3>
          </div>
          <Badge variant={progressStatus === 'complete' ? 'default' : 'secondary'}>
            {completionPercentage}% completo
          </Badge>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <Progress
            value={completionPercentage}
            className="h-2"
          />
          <p className={cn('text-sm', config.text)}>
            {config.message}
          </p>
        </div>
      </div>

      {/* Disclaimer especial para immigration_services */}
      {agencyType === 'immigration_services' && (
        <div className={cn(
          'p-3 rounded-lg border-2 border-dashed',
          disclaimerAccepted
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
        )}>
          <div className="flex items-center space-x-2">
            {disclaimerAccepted ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <div className="flex-1">
              <p className={cn(
                'text-sm font-medium',
                disclaimerAccepted ? 'text-green-700' : 'text-red-700'
              )}>
                Declaración Legal
                <span className="text-red-500 ml-1">*</span>
              </p>
              <p className={cn(
                'text-xs',
                disclaimerAccepted ? 'text-green-600' : 'text-red-600'
              )}>
                {disclaimerAccepted
                  ? 'Declaración aceptada ✓'
                  : 'Requerida para completar el registro'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detalles por sección */}
      {showDetails && (
        <div className="space-y-3">
          {fieldGroups.map(group => {
            const GroupIcon = group.icon;
            const completion = groupCompletions[group.id] || { completed: 0, total: 0, required: 0 };
            const isGroupComplete = completion.required === 0 || completion.completed >= completion.required;

            return (
              <div
                key={group.id}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  isGroupComplete
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GroupIcon className={cn(
                      'h-4 w-4',
                      isGroupComplete ? 'text-green-600' : 'text-gray-500'
                    )} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {group.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {completion.completed} de {completion.total} campos completados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isGroupComplete && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    <Badge
                      variant={isGroupComplete ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {completion.required > 0 && `${Math.round((Math.min(completion.completed, completion.required) / completion.required) * 100)}%`}
                    </Badge>
                  </div>
                </div>

                {/* Mini progress para la sección */}
                {completion.required > 0 && (
                  <div className="mt-2">
                    <Progress
                      value={(Math.min(completion.completed, completion.required) / completion.required) * 100}
                      className="h-1"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recordatorio amigable */}
      {completionPercentage < 100 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Recuerda:</strong> Puedes guardar tu progreso en cualquier momento y continuar más tarde. Los campos marcados con <span className="text-red-500">*</span> son los únicos requeridos para el registro básico.
          </p>
        </div>
      )}
    </div>
  );
}