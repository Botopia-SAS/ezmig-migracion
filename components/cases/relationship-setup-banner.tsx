'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Users, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RelationshipSetupBannerProps {
  caseId: number;
  hasRelationships: boolean;
  onSetupComplete?: () => void;
}

export function RelationshipSetupBanner({
  caseId,
  hasRelationships,
  onSetupComplete
}: RelationshipSetupBannerProps) {
  const t = useTranslations('dashboard.cases');
  const [dismissed, setDismissed] = useState(false);

  // Don't show if relationships are already configured or banner is dismissed
  if (hasRelationships || dismissed) {
    return null;
  }

  const handleSetupClick = () => {
    // TODO: Open relationship setup modal/dialog
    console.log('Setup relationships for case:', caseId);
    // For now, just dismiss the banner
    setDismissed(true);
    onSetupComplete?.();
  };

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-amber-800 mb-1">
            {t('relationshipSetup.title', { defaultMessage: 'Personalize Your Forms' })}
          </p>
          <p className="text-sm text-amber-700">
            {t('relationshipSetup.description', {
              defaultMessage: 'Configure petitioner and beneficiary information to show personalized form questions with actual names instead of generic terms.'
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSetupClick}
            className="text-amber-700 border-amber-300 hover:bg-amber-100"
          >
            <Users className="h-4 w-4 mr-1" />
            {t('relationshipSetup.setupButton', { defaultMessage: 'Setup Relationships' })}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:bg-amber-100 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Quick setup card for cases without relationships
export function RelationshipQuickSetup({ caseId }: { caseId: number }) {
  const t = useTranslations('dashboard.cases');

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-900 flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('relationshipSetup.quickSetup.title', { defaultMessage: 'Form Personalization' })}
        </CardTitle>
        <CardDescription className="text-blue-700">
          {t('relationshipSetup.quickSetup.description', {
            defaultMessage: 'Set up petitioner and beneficiary relationships to get personalized form questions with real names.'
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-2">
              {t('relationshipSetup.benefits.title', { defaultMessage: 'Benefits:' })}
            </p>
            <ul className="space-y-1 ml-4">
              <li>• {t('relationshipSetup.benefits.personalized', {
                defaultMessage: 'Questions show actual names: "What is Santiago\'s relationship to María?"'
              })}</li>
              <li>• {t('relationshipSetup.benefits.clarity', {
                defaultMessage: 'Reduces confusion with clear, personalized language'
              })}</li>
              <li>• {t('relationshipSetup.benefits.experience', {
                defaultMessage: 'Better user experience for clients filling forms'
              })}</li>
            </ul>
          </div>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              // TODO: Open relationship setup modal
              console.log('Quick setup for case:', caseId);
            }}
          >
            <Users className="h-4 w-4 mr-2" />
            {t('relationshipSetup.quickSetup.button', { defaultMessage: 'Setup Now' })}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}