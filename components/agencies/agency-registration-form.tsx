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
      toast.success('Cambios guardados correctamente');
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error('Error al guardar los cambios');
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
      toast.success('Registro enviado correctamente');
    } catch (error) {
      toast.error('Error al enviar el registro');
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

  return (
    <div className={cn('max-w-4xl mx-auto space-y-8', className)}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {mode === 'register' ? 'Registro de Agencia' : 'Configuración de Agencia'}
        </h1>
        <p className="text-gray-600">
          {mode === 'register'
            ? 'Completa la información para registrar tu agencia en EZMig'
            : 'Actualiza la información de tu agencia'
          }
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
          <span>Guardando automáticamente...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tipo de Agencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Tipo de Agencia</span>
                {mode === 'settings' && <span className="text-xs text-gray-500">(no editable)</span>}
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

          {/* Información Empresarial */}
          <Card>
            <CardHeader>
              <CardTitle>Información Empresarial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="legal-name">
                    Nombre Legal del Negocio
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="legal-name"
                    value={formData.legalBusinessName || ''}
                    onChange={(e) => updateField('legalBusinessName', e.target.value)}
                    placeholder="Ej: Smith & Associates Law Firm LLC"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="dba-name">Nombre Comercial (DBA)</Label>
                  <Input
                    id="dba-name"
                    value={formData.businessNameDba || ''}
                    onChange={(e) => updateField('businessNameDba', e.target.value)}
                    placeholder="Ej: Smith Law Group"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EmailInput
                  label="Email Empresarial"
                  value={formData.businessEmail || ''}
                  onChange={(value) => updateField('businessEmail', value)}
                  checkAvailability={mode === 'register'}
                  required
                  disabled={isLoading}
                  description="Email principal para comunicaciones oficiales"
                />

                <PhoneInput
                  label="Teléfono Empresarial"
                  value={formData.businessPhone || ''}
                  onChange={(value) => updateField('businessPhone', value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="website">Sitio Web</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://tu-sitio-web.com"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <GoogleMapsAutocomplete
                value={formData.address || ''}
                onAddressSelect={handleAddressSelect}
                label="Dirección de la Oficina"
                placeholder="Ingresa tu dirección..."
                required
                disabled={isLoading}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Ciudad"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => updateField('state', e.target.value)}
                    placeholder="CA"
                    maxLength={2}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="zipcode">Código Postal</Label>
                  <Input
                    id="zipcode"
                    value={formData.zipCode || ''}
                    onChange={(e) => updateField('zipCode', e.target.value)}
                    placeholder="90210"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Legal - Solo para Law Firms */}
          {formData.agencyType === 'law_firm' && (
            <Card>
              <CardHeader>
                <CardTitle>Información Legal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firm-registration">Número de Registro del Bufete</Label>
                    <Input
                      id="firm-registration"
                      value={formData.firmRegistrationNumber || ''}
                      onChange={(e) => updateField('firmRegistrationNumber', e.target.value)}
                      placeholder="Ej: 123456789"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="registration-state">Estado de Registro</Label>
                    <Input
                      id="registration-state"
                      value={formData.firmRegistrationState || ''}
                      onChange={(e) => updateField('firmRegistrationState', e.target.value)}
                      placeholder="CA"
                      maxLength={2}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="business-license">Número de Licencia Comercial</Label>
                  <Input
                    id="business-license"
                    value={formData.businessLicenseNumber || ''}
                    onChange={(e) => updateField('businessLicenseNumber', e.target.value)}
                    placeholder="Ej: BL-2024-001234"
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información del Propietario */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Propietario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="owner-name">
                    Nombre Completo
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="owner-name"
                    value={formData.ownerFullName || ''}
                    onChange={(e) => updateField('ownerFullName', e.target.value)}
                    placeholder="Nombre completo del propietario"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="owner-position">Posición/Título</Label>
                  <Input
                    id="owner-position"
                    value={formData.ownerPosition || ''}
                    onChange={(e) => updateField('ownerPosition', e.target.value)}
                    placeholder="CEO, Managing Partner, etc."
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EmailInput
                  label="Email del Propietario"
                  value={formData.ownerEmail || ''}
                  onChange={(value) => updateField('ownerEmail', value)}
                  required
                  disabled={isLoading}
                  description="Para comunicaciones importantes y cambios de configuración"
                />

                <PhoneInput
                  label="Teléfono del Propietario"
                  value={formData.ownerPhone || ''}
                  onChange={(value) => updateField('ownerPhone', value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer - Solo para immigration_services */}
          {formData.agencyType === 'immigration_services' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Declaración Legal</span>
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

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones</CardTitle>
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
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isLoading || !canSubmit()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {mode === 'register' ? 'Registrar Agencia' : 'Actualizar Información'}
              </Button>

              {!canSubmit() && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Campos pendientes
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        {formData.agencyType === 'immigration_services' && !disclaimerAccepted
                          ? 'Debes aceptar la declaración legal para continuar.'
                          : 'Completa los campos obligatorios marcados con * para continuar.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información de ayuda */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Info className="h-4 w-4" />
                <span>¿Necesitas ayuda?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>
                • Los campos con <span className="text-red-500">*</span> son obligatorios
              </p>
              <p>
                • Tu progreso se guarda automáticamente cada 2 segundos
              </p>
              <p>
                • Puedes completar el registro en múltiples sesiones
              </p>
              <p>
                • Contáctanos si necesitas asistencia: <a href="mailto:support@ezmig.com" className="text-violet-600 hover:underline">support@ezmig.com</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}