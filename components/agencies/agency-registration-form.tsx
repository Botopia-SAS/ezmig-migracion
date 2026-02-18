'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Save, Send, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { AgencyRegistrationData } from '@/lib/db/schema';

// Importar componentes personalizados
import { AgencyTypeSelector } from './agency-type-selector';
import { EmailInput } from './email-input';
import { PhoneInput } from './phone-input';
import { GoogleMapsAutocomplete } from './google-maps-autocomplete';
import { DisclaimerCheckbox } from './disclaimer-checkbox';
import { ProgressCounter } from './progress-counter';

interface AgencyRegistrationFormProps {
  initialData?: Partial<AgencyRegistrationData>;
  mode?: 'register' | 'settings';
  onSubmit?: (data: AgencyRegistrationData) => Promise<void>;
  onSave?: (data: Partial<AgencyRegistrationData>) => Promise<void>;
  isLoading?: boolean;
  compact?: boolean;
  className?: string;
}

const STORAGE_KEY = 'ezmig_agency_registration_draft';

export function AgencyRegistrationForm({
  initialData = {},
  mode = 'register',
  onSubmit,
  onSave,
  isLoading = false,
  compact = false,
  className
}: AgencyRegistrationFormProps) {
  const t = useTranslations('agencies.form');
  const [formData, setFormData] = useState<Partial<AgencyRegistrationData>>(initialData);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    if (mode === 'register' && !initialData.agencyType) {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setFormData({ ...parsed });
          setDisclaimerAccepted(parsed.disclaimerAccepted || false);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, [mode, initialData]);

  // Auto-save en localStorage cada 2 segundos cuando hay cambios
  useEffect(() => {
    if (mode !== 'register' || !hasUnsavedChanges) return;

    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          ...formData,
          disclaimerAccepted,
          lastSaved: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [formData, disclaimerAccepted, hasUnsavedChanges, mode]);

  // Helper para actualizar campos del formulario
  const updateField = (field: keyof AgencyRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Helper para manejar selección de dirección de Google Maps
  const handleAddressSelect = (addressData: any) => {
    setFormData(prev => ({
      ...prev,
      address: addressData.address,
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.zipCode,
      googlePlaceId: addressData.placeId,
      coordinatesLat: addressData.coordinates.lat.toString(),
      coordinatesLng: addressData.coordinates.lng.toString()
    }));
    setHasUnsavedChanges(true);
  };

  // Validar si el formulario se puede enviar
  const canSubmit = () => {
    // Para immigration_services, disclaimer es obligatorio
    if (formData.agencyType === 'immigration_services' && !disclaimerAccepted) {
      return false;
    }

    // Campos mínimos requeridos para cualquier tipo de agencia
    const requiredFields = [
      'legalBusinessName',
      'businessEmail',
      'agencyType'
    ] as const;

    return requiredFields.every(field => {
      const value = formData[field];
      return value && value.toString().trim().length > 0;
    });
  };

  // Manejar guardado manual
  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(formData);
      toast.success(t('saveSuccess'));
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error(t('saveError'));
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!onSubmit || !canSubmit()) return;

    const finalData: AgencyRegistrationData = {
      agencyType: formData.agencyType!,
      legalBusinessName: formData.legalBusinessName || '',
      businessNameDba: formData.businessNameDba || '',
      businessEmail: formData.businessEmail || '',
      businessPhone: formData.businessPhone || '',
      website: formData.website || '',
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || '',
      zipCode: formData.zipCode || '',
      country: 'USA',
      googlePlaceId: formData.googlePlaceId,
      coordinatesLat: formData.coordinatesLat,
      coordinatesLng: formData.coordinatesLng,
      firmRegistrationNumber: formData.firmRegistrationNumber || '',
      firmRegistrationState: formData.firmRegistrationState || '',
      businessLicenseNumber: formData.businessLicenseNumber || '',
      ownerFullName: formData.ownerFullName || '',
      ownerPosition: formData.ownerPosition || '',
      ownerEmail: formData.ownerEmail || '',
      ownerPhone: formData.ownerPhone || '',
      disclaimerAccepted: disclaimerAccepted,
      disclaimerAcceptedAt: disclaimerAccepted ? new Date() : undefined,
      agencyStatus: 'pending',
      completionPercentage: 0
    };

    try {
      await onSubmit(finalData);
      // Limpiar localStorage después del registro exitoso
      if (mode === 'register') {
        localStorage.removeItem(STORAGE_KEY);
      }
      toast.success(t('submitSuccess'));
    } catch (error) {
      toast.error(t('submitError'));
      console.error('Submit error:', error);
    }
  };

  // Compact layout for onboarding — single column, no cards, no sidebar
  if (compact) {
    const handleCompactSubmit = async () => {
      if (onSave) {
        await onSave(formData);
      } else if (onSubmit && canSubmit()) {
        await handleSubmit();
      }
    };

    return (
      <div className={cn('space-y-6', className)}>
        {/* Agency Type */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">{t('sections.agencyType')} <span className="text-red-500">*</span></p>
          <AgencyTypeSelector
            value={formData.agencyType || null}
            onChange={(type) => updateField('agencyType', type)}
            compact
          />
        </div>

        <Separator />

        {/* Business Info */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">{t('sections.businessInfo')}</p>
          <div>
            <Label htmlFor="legal-name">
              {t('fields.legalBusinessName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="legal-name"
              value={formData.legalBusinessName || ''}
              onChange={(e) => updateField('legalBusinessName', e.target.value)}
              placeholder={t('placeholders.legalBusinessName')}
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="dba-name">{t('fields.dbaName')}</Label>
            <Input
              id="dba-name"
              value={formData.businessNameDba || ''}
              onChange={(e) => updateField('businessNameDba', e.target.value)}
              placeholder={t('placeholders.dbaName')}
              disabled={isLoading}
            />
          </div>
          <EmailInput
            label={t('fields.businessEmail')}
            value={formData.businessEmail || ''}
            onChange={(value) => updateField('businessEmail', value)}
            checkAvailability={mode === 'register'}
            required
            disabled={isLoading}
          />
          <PhoneInput
            label={t('fields.businessPhone')}
            value={formData.businessPhone || ''}
            onChange={(value) => updateField('businessPhone', value)}
            required
            disabled={isLoading}
          />
          <div>
            <Label htmlFor="website">{t('fields.website')}</Label>
            <Input
              id="website"
              type="url"
              value={formData.website || ''}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder={t('placeholders.website')}
              disabled={isLoading}
            />
          </div>
        </div>

        <Separator />

        {/* Location */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">{t('sections.location')}</p>
          <GoogleMapsAutocomplete
            value={formData.address || ''}
            onAddressSelect={handleAddressSelect}
            label={t('fields.address')}
            placeholder={t('fields.addressPlaceholder')}
            required
            disabled={isLoading}
          />
          <div>
            <Label htmlFor="city">{t('fields.city')}</Label>
            <Input
              id="city"
              value={formData.city || ''}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder={t('placeholders.city')}
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="state">{t('fields.state')}</Label>
              <Input
                id="state"
                value={formData.state || ''}
                onChange={(e) => updateField('state', e.target.value)}
                placeholder={t('placeholders.state')}
                maxLength={2}
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="zipcode">{t('fields.zipCode')}</Label>
              <Input
                id="zipcode"
                value={formData.zipCode || ''}
                onChange={(e) => updateField('zipCode', e.target.value)}
                placeholder={t('placeholders.zipCode')}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Legal Info - Law Firms only */}
        {formData.agencyType === 'law_firm' && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">{t('sections.legalInfo')}</p>
              <div>
                <Label htmlFor="firm-registration">{t('fields.firmRegistrationNumber')}</Label>
                <Input
                  id="firm-registration"
                  value={formData.firmRegistrationNumber || ''}
                  onChange={(e) => updateField('firmRegistrationNumber', e.target.value)}
                  placeholder={t('placeholders.firmRegistration')}
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="registration-state">{t('fields.registrationState')}</Label>
                  <Input
                    id="registration-state"
                    value={formData.firmRegistrationState || ''}
                    onChange={(e) => updateField('firmRegistrationState', e.target.value)}
                    placeholder={t('placeholders.registrationState')}
                    maxLength={2}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="business-license">{t('fields.businessLicense')}</Label>
                  <Input
                    id="business-license"
                    value={formData.businessLicenseNumber || ''}
                    onChange={(e) => updateField('businessLicenseNumber', e.target.value)}
                    placeholder={t('placeholders.businessLicense')}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Owner Info */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">{t('sections.owner')}</p>
          <div>
            <Label htmlFor="owner-name">
              {t('fields.ownerFullName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="owner-name"
              value={formData.ownerFullName || ''}
              onChange={(e) => updateField('ownerFullName', e.target.value)}
              placeholder={t('placeholders.ownerName')}
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="owner-position">{t('fields.ownerPosition')}</Label>
            <Input
              id="owner-position"
              value={formData.ownerPosition || ''}
              onChange={(e) => updateField('ownerPosition', e.target.value)}
              placeholder={t('placeholders.ownerPosition')}
              disabled={isLoading}
            />
          </div>
          <EmailInput
            label={t('fields.ownerEmail')}
            value={formData.ownerEmail || ''}
            onChange={(value) => updateField('ownerEmail', value)}
            required
            disabled={isLoading}
          />
          <PhoneInput
            label={t('fields.ownerPhone')}
            value={formData.ownerPhone || ''}
            onChange={(value) => updateField('ownerPhone', value)}
            disabled={isLoading}
          />
        </div>

        {/* Disclaimer - immigration_services only */}
        {formData.agencyType === 'immigration_services' && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {t('sections.disclaimer')} <span className="text-red-500">*</span>
              </p>
              <DisclaimerCheckbox
                value={disclaimerAccepted}
                onChange={setDisclaimerAccepted}
                agencyType={formData.agencyType}
                disabled={isLoading}
              />
            </div>
          </>
        )}

        {/* Submit */}
        <Button
          onClick={handleCompactSubmit}
          disabled={isLoading || !canSubmit()}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('submitting')}
            </>
          ) : (
            t('submit')
          )}
        </Button>

        <p className="text-xs text-gray-400 text-center">
          {t('requiredNote')}
        </p>
      </div>
    );
  }

  // Minimal layout for settings inside dashboard
  if (mode === 'settings') {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
            {t('settingsTitle')}
          </p>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('settingsSubtitle')}
          </h1>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-8">
            {/* Agency Type */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-gray-900">
                  {t('sections.agencyType')}
                </p>
                {formData.agencyType ? (
                  <span className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
                    {t('notEditable')}
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
                    {t('required')}
                  </span>
                )}
              </div>
              <div className={cn(
                "rounded-xl border p-4",
                formData.agencyType
                  ? "border-dashed border-gray-200 bg-gray-50"
                  : "border-amber-200 bg-amber-50/50"
              )}>
                <AgencyTypeSelector
                  value={formData.agencyType || null}
                  onChange={(type) => updateField('agencyType', type)}
                  disabled={!!formData.agencyType}
                />
              </div>
            </div>

            {/* Business Info */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">
                {t('sections.businessInfo')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="legal-name" className="text-sm text-gray-700">
                    {t('fields.legalBusinessName')}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="legal-name"
                    value={formData.legalBusinessName || ''}
                    onChange={(e) => updateField('legalBusinessName', e.target.value)}
                    placeholder={t('placeholders.legalBusinessName')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dba-name" className="text-sm text-gray-700">{t('fields.dbaName')}</Label>
                  <Input
                    id="dba-name"
                    value={formData.businessNameDba || ''}
                    onChange={(e) => updateField('businessNameDba', e.target.value)}
                    placeholder={t('placeholders.dbaName')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EmailInput
                  label={t('fields.businessEmail')}
                  value={formData.businessEmail || ''}
                  onChange={(value) => updateField('businessEmail', value)}
                  checkAvailability={false}
                  required
                  disabled={isLoading}
                  description={t('descriptions.businessEmail')}
                />

                <PhoneInput
                  label={t('fields.businessPhone')}
                  value={formData.businessPhone || ''}
                  onChange={(value) => updateField('businessPhone', value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-sm text-gray-700">{t('fields.website')}</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder={t('placeholders.website')}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">
                {t('sections.location')}
              </p>

              <GoogleMapsAutocomplete
                value={formData.address || ''}
                onAddressSelect={handleAddressSelect}
                label={t('fields.address')}
                placeholder={t('fields.addressPlaceholder')}
                required
                disabled={isLoading}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="city" className="text-sm text-gray-700">{t('fields.city')}</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder={t('placeholders.city')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-sm text-gray-700">{t('fields.state')}</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => updateField('state', e.target.value)}
                    placeholder={t('placeholders.state')}
                    maxLength={2}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="zipcode" className="text-sm text-gray-700">{t('fields.zipCode')}</Label>
                  <Input
                    id="zipcode"
                    value={formData.zipCode || ''}
                    onChange={(e) => updateField('zipCode', e.target.value)}
                    placeholder={t('placeholders.zipCode')}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Legal Info - Law Firms only */}
            {formData.agencyType === 'law_firm' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900">
                  {t('sections.legalInfo')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firm-registration" className="text-sm text-gray-700">{t('fields.firmRegistrationNumber')}</Label>
                    <Input
                      id="firm-registration"
                      value={formData.firmRegistrationNumber || ''}
                      onChange={(e) => updateField('firmRegistrationNumber', e.target.value)}
                      placeholder={t('placeholders.firmRegistration')}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="registration-state" className="text-sm text-gray-700">{t('fields.registrationState')}</Label>
                    <Input
                      id="registration-state"
                      value={formData.firmRegistrationState || ''}
                      onChange={(e) => updateField('firmRegistrationState', e.target.value)}
                      placeholder={t('placeholders.registrationState')}
                      maxLength={2}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="business-license" className="text-sm text-gray-700">{t('fields.businessLicense')}</Label>
                  <Input
                    id="business-license"
                    value={formData.businessLicenseNumber || ''}
                    onChange={(e) => updateField('businessLicenseNumber', e.target.value)}
                    placeholder={t('placeholders.businessLicense')}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Owner Info */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">
                {t('sections.owner')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="owner-name" className="text-sm text-gray-700">
                    {t('fields.ownerFullName')}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="owner-name"
                    value={formData.ownerFullName || ''}
                    onChange={(e) => updateField('ownerFullName', e.target.value)}
                    placeholder={t('placeholders.ownerName')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="owner-position" className="text-sm text-gray-700">{t('fields.ownerPosition')}</Label>
                  <Input
                    id="owner-position"
                    value={formData.ownerPosition || ''}
                    onChange={(e) => updateField('ownerPosition', e.target.value)}
                    placeholder={t('placeholders.ownerPosition')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EmailInput
                  label={t('fields.ownerEmail')}
                  value={formData.ownerEmail || ''}
                  onChange={(value) => updateField('ownerEmail', value)}
                  required
                  disabled={isLoading}
                  description={t('descriptions.ownerEmail')}
                />

                <PhoneInput
                  label={t('fields.ownerPhone')}
                  value={formData.ownerPhone || ''}
                  onChange={(value) => updateField('ownerPhone', value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Disclaimer - immigration_services only */}
            {formData.agencyType === 'immigration_services' && (
              <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  {t('sections.disclaimer')}
                  <span className="text-red-500">*</span>
                </p>
                <DisclaimerCheckbox
                  value={disclaimerAccepted}
                  onChange={setDisclaimerAccepted}
                  agencyType={formData.agencyType}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            {hasUnsavedChanges && (
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                <Save className="h-4 w-4" />
                {t('autosaving')}
              </div>
            )}

            <div className="flex gap-3 sm:ml-auto">
              {onSave && (
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isLoading || isSaving || !canSubmit()}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('actions.saving')}
                    </>
                  ) : (
                    t('actions.save')
                  )}
                </Button>
              )}

              {onSubmit && (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !canSubmit()}
                >
                  {mode === 'register' ? t('actions.register') : t('actions.update')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-4xl mx-auto space-y-8', className)}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {mode === 'register' ? t('registerTitle') : t('settingsTitle')}
        </h1>
        <p className="text-gray-600">
          {mode === 'register' ? t('subtitle') : t('settingsSubtitle')}
        </p>
      </div>

      {/* Progress Counter - Solo en modo registro */}
      {mode === 'register' && (
        <ProgressCounter
          data={formData}
          agencyType={formData.agencyType || null}
          disclaimerAccepted={disclaimerAccepted}
          showDetails={false}
        />
      )}

      {/* Auto-save indicator */}
      {mode === 'register' && hasUnsavedChanges && (
        <div className="flex items-center justify-center space-x-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
          <Save className="h-4 w-4 animate-pulse" />
          <span>{t('autosaving')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tipo de Agencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>{t('sections.agencyType')}</span>
                {mode === 'settings' && <span className="text-xs text-gray-500">{t('notEditable')}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AgencyTypeSelector
                value={formData.agencyType || null}
                onChange={(type) => updateField('agencyType', type)}
                disabled={mode === 'settings'}
              />
            </CardContent>
          </Card>

          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.businessInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="legal-name">
                    {t('fields.legalBusinessName')}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="legal-name"
                    value={formData.legalBusinessName || ''}
                    onChange={(e) => updateField('legalBusinessName', e.target.value)}
                    placeholder={t('placeholders.legalBusinessName')}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="dba-name">{t('fields.dbaName')}</Label>
                  <Input
                    id="dba-name"
                    value={formData.businessNameDba || ''}
                    onChange={(e) => updateField('businessNameDba', e.target.value)}
                    placeholder={t('placeholders.dbaName')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EmailInput
                  label={t('fields.businessEmail')}
                  value={formData.businessEmail || ''}
                  onChange={(value) => updateField('businessEmail', value)}
                  checkAvailability={mode === 'register'}
                  required
                  disabled={isLoading}
                  description={t('descriptions.businessEmail')}
                />

                <PhoneInput
                  label={t('fields.businessPhone')}
                  value={formData.businessPhone || ''}
                  onChange={(value) => updateField('businessPhone', value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="website">{t('fields.website')}</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder={t('placeholders.website')}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.location')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <GoogleMapsAutocomplete
                value={formData.address || ''}
                onAddressSelect={handleAddressSelect}
                label={t('fields.address')}
                placeholder={t('fields.addressPlaceholder')}
                required
                disabled={isLoading}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="city">{t('fields.city')}</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder={t('placeholders.city')}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="state">{t('fields.state')}</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => updateField('state', e.target.value)}
                    placeholder={t('placeholders.state')}
                    maxLength={2}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="zipcode">{t('fields.zipCode')}</Label>
                  <Input
                    id="zipcode"
                    value={formData.zipCode || ''}
                    onChange={(e) => updateField('zipCode', e.target.value)}
                    placeholder={t('placeholders.zipCode')}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Info - Law Firms only */}
          {formData.agencyType === 'law_firm' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('sections.legalInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firm-registration">{t('fields.firmRegistrationNumber')}</Label>
                    <Input
                      id="firm-registration"
                      value={formData.firmRegistrationNumber || ''}
                      onChange={(e) => updateField('firmRegistrationNumber', e.target.value)}
                      placeholder={t('placeholders.firmRegistration')}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="registration-state">{t('fields.registrationState')}</Label>
                    <Input
                      id="registration-state"
                      value={formData.firmRegistrationState || ''}
                      onChange={(e) => updateField('firmRegistrationState', e.target.value)}
                      placeholder={t('placeholders.registrationState')}
                      maxLength={2}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="business-license">{t('fields.businessLicense')}</Label>
                  <Input
                    id="business-license"
                    value={formData.businessLicenseNumber || ''}
                    onChange={(e) => updateField('businessLicenseNumber', e.target.value)}
                    placeholder={t('placeholders.businessLicense')}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Owner Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.owner')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="owner-name">
                    {t('fields.ownerFullName')}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="owner-name"
                    value={formData.ownerFullName || ''}
                    onChange={(e) => updateField('ownerFullName', e.target.value)}
                    placeholder={t('placeholders.ownerName')}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="owner-position">{t('fields.ownerPosition')}</Label>
                  <Input
                    id="owner-position"
                    value={formData.ownerPosition || ''}
                    onChange={(e) => updateField('ownerPosition', e.target.value)}
                    placeholder={t('placeholders.ownerPosition')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EmailInput
                  label={t('fields.ownerEmail')}
                  value={formData.ownerEmail || ''}
                  onChange={(value) => updateField('ownerEmail', value)}
                  required
                  disabled={isLoading}
                  description={t('descriptions.ownerEmail')}
                />

                <PhoneInput
                  label={t('fields.ownerPhone')}
                  value={formData.ownerPhone || ''}
                  onChange={(value) => updateField('ownerPhone', value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer - immigration_services only */}
          {formData.agencyType === 'immigration_services' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>{t('sections.disclaimer')}</span>
                  <span className="text-red-500">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DisclaimerCheckbox
                  value={disclaimerAccepted}
                  onChange={setDisclaimerAccepted}
                  agencyType={formData.agencyType}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar con progreso y acciones */}
        <div className="space-y-6">
          {/* Progress Counter detallado */}
          <ProgressCounter
            data={formData}
            agencyType={formData.agencyType || null}
            disclaimerAccepted={disclaimerAccepted}
            showDetails={true}
          />

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('actions.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {onSave && (
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isLoading || isSaving || !hasUnsavedChanges}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? t('actions.saving') : t('actions.save')}
                </Button>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isLoading || !canSubmit()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {mode === 'register' ? t('actions.register') : t('actions.update')}
              </Button>

              {!canSubmit() && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        {t('actions.pendingTitle')}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        {formData.agencyType === 'immigration_services' && !disclaimerAccepted
                          ? t('actions.disclaimerRequired')
                          : t('actions.requiredFieldsMessage')
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Info className="h-4 w-4" />
                <span>{t('help.title')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>
                • {t('help.required')}
              </p>
              <p>
                • {t('help.autosave')}
              </p>
              <p>
                • {t('help.multipleSessions')}
              </p>
              <p>
                • {t('help.contact')} <a href="mailto:support@ezmig.com" className="text-violet-600 hover:underline">support@ezmig.com</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}