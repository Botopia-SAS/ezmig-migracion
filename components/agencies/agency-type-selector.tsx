'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, FileText, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface AgencyTypeSelectorProps {
  value: 'law_firm' | 'immigration_services' | null;
  onChange: (type: 'law_firm' | 'immigration_services') => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

const AGENCY_TYPE_IDS = ['law_firm', 'immigration_services'] as const;
const AGENCY_TYPE_ICONS = { law_firm: Scale, immigration_services: FileText };
const AGENCY_TYPE_COLORS = {
  law_firm: 'from-blue-500 to-indigo-600',
  immigration_services: 'from-green-500 to-emerald-600'
};

export function AgencyTypeSelector({
  value,
  onChange,
  disabled = false,
  compact = false,
  className
}: AgencyTypeSelectorProps) {
  const t = useTranslations('agencies.typeSelector');
  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {AGENCY_TYPE_IDS.map((id) => {
          const Icon = AGENCY_TYPE_ICONS[id];
          const isSelected = value === id;

          return (
            <button
              key={id}
              onClick={() => !disabled && onChange(id)}
              disabled={disabled}
              className={cn(
                'w-full p-3 rounded-lg border-2 text-left transition-all',
                'hover:border-indigo-600 hover:bg-gray-50',
                isSelected
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 bg-white',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-2 rounded-lg bg-gradient-to-r shrink-0',
                    AGENCY_TYPE_COLORS[id]
                  )}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">{t(`types.${id}.title`)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t(`types.${id}.description`)}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  const features = (id: string): string[] => {
    const count = 4;
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(t(`types.${id}.features.${i}`));
    }
    return result;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('title')}
        </h2>
        <p className="text-gray-600">
          {t('description')}
        </p>
        {disabled && (
          <Badge variant="secondary" className="mt-2">
            <Lock className="h-3 w-3 mr-1" />
            {t('cannotChange')}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {AGENCY_TYPE_IDS.map((id) => {
          const Icon = AGENCY_TYPE_ICONS[id];
          const isSelected = value === id;

          return (
            <Card
              key={id}
              className={cn(
                'cursor-pointer transition-all duration-200 border-2',
                isSelected
                  ? 'border-violet-500 ring-2 ring-violet-100 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md',
                disabled && 'cursor-not-allowed opacity-60'
              )}
              onClick={() => !disabled && onChange(id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div
                    className={cn(
                      'flex-shrink-0 p-3 rounded-lg bg-gradient-to-r',
                      AGENCY_TYPE_COLORS[id]
                    )}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {t(`types.${id}.title`)}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {t(`types.${id}.description`)}
                    </p>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('servicesIncluded')}
                      </p>
                      <ul className="space-y-1">
                        {features(id).map((feature, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 flex items-center"
                          >
                            <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {value && (
        <div className="mt-6 p-4 bg-violet-50 border border-violet-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-violet-500 rounded-full flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1.5" />
            </div>
            <div>
              <p className="text-sm font-medium text-violet-900">
                {t('selectedType')}: {t(`types.${value}.title`)}
              </p>
              <p className="text-xs text-violet-700 mt-1">
                {t('cannotChange')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}