'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AutoReloadSettings {
  enabled: boolean;
  threshold: number;
  package: string;
  hasPaymentMethod: boolean;
  isOwner: boolean;
}

interface TokenPackage {
  id: number;
  name: string;
  tokens: number;
  priceInCents: number;
}

export default function SettingsPage() {
  const t = useTranslations('dashboard.billing.settings');
  const { data: settings, isLoading: isLoadingSettings } = useSWR<AutoReloadSettings>(
    '/api/tokens/auto-reload',
    fetcher
  );
  const { data: packagesData } = useSWR<{ packages: TokenPackage[] }>(
    '/api/tokens/packages',
    fetcher
  );

  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState(5);
  const [selectedPackage, setSelectedPackage] = useState('10');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setThreshold(settings.threshold);
      setSelectedPackage(settings.package);
    }
  }, [settings]);

  const packages = packagesData?.packages ?? [];

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/tokens/auto-reload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          threshold,
          package: selectedPackage,
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
        mutate('/api/tokens/auto-reload');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const isOwner = settings?.isOwner ?? false;
  const hasPaymentMethod = settings?.hasPaymentMethod ?? false;

  return (
    <section className="flex-1">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/billing">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-gray-900 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            {t('back')}
          </Button>
        </Link>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          {t('title')}
        </h1>
      </div>

      {isLoadingSettings ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Auto-Reload Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-violet-600" />
                <CardTitle>{t('enable.title')}</CardTitle>
              </div>
              <CardDescription>
                {t('subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isOwner && (
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('ownerOnly')}
                  </AlertDescription>
                </Alert>
              )}

              {!hasPaymentMethod && isOwner && (
                <Alert variant="info">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t('noPaymentMethod')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Enable Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-reload-toggle" className="font-medium">
                    {t('enable.title')}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {t('enable.description')}
                  </p>
                </div>
                <Switch
                  id="auto-reload-toggle"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                  disabled={!isOwner || !hasPaymentMethod}
                />
              </div>

              {/* Threshold Input */}
              <div className="space-y-2">
                <Label htmlFor="threshold">{t('threshold.title')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="threshold"
                    type="number"
                    min={1}
                    max={100}
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value) || 5)}
                    className="w-24"
                    disabled={!isOwner || !enabled}
                  />
                  <span className="text-gray-500">tokens</span>
                </div>
              </div>

              {/* Package Selection */}
              <div className="space-y-2">
                <Label htmlFor="package">{t('package.title')}</Label>
                <Select
                  value={selectedPackage}
                  onValueChange={setSelectedPackage}
                  disabled={!isOwner || !enabled}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.tokens.toString()}>
                        {pkg.name} - {pkg.tokens} tokens (${(pkg.priceInCents / 100).toFixed(0)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                {saveStatus === 'success' && (
                  <Alert variant="success" className="py-2">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>Settings saved</AlertDescription>
                  </Alert>
                )}
                {saveStatus === 'error' && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Error saving settings</AlertDescription>
                  </Alert>
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={!isOwner || isSaving}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('save')
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </section>
  );
}
