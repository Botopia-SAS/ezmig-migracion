'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelectInput } from '@/components/ui/multi-select-input';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Globe,
  Building,
  AlertTriangle,
  Shield,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import type { FreelancerRegistrationData } from '@/lib/db/schema';

// Schema de validación
const freelancerSchema = z.object({
  professionalType: z.enum(['immigration_attorney', 'form_preparer']),
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos').optional(),
  primaryState: z.string().length(2, 'Código de estado debe ser de 2 letras').optional(),
  primaryCity: z.string().min(2, 'Ciudad debe tener al menos 2 caracteres').optional(),
  barNumber: z.string().optional(),
  primaryBarState: z.string().length(2, 'Código de estado debe ser de 2 letras').optional(),
  additionalBarStates: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  customSpecialties: z.array(z.string()).optional(),
  businessLicenseNumber: z.string().optional(),
  disclaimerAccepted: z.boolean(),
  hasBusiness: z.boolean().optional(),
  businessName: z.string().optional(),
  businessEntityType: z.enum(['sole_proprietor', 'llc_single_member', 'llc_multi_member', 'c_corp', 's_corp']).optional(),
  businessWebsite: z.string().url('URL inválida').optional().or(z.literal('')),
  profilePhotoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  bio: z.string().max(1000, 'Bio no puede exceder 1000 caracteres').optional(),
  yearsExperience: z.number().min(0, 'Años de experiencia no puede ser negativo').optional(),
  languages: z.array(z.string()).optional(),
  customLanguages: z.array(z.string()).optional(),
  officeAddress: z.string().optional(),
  officeCity: z.string().optional(),
  officeState: z.string().length(2, 'Código de estado debe ser de 2 letras').optional(),
  officeZipCode: z.string().min(5, 'Código postal debe tener al menos 5 dígitos').optional(),
  linkedinUrl: z.string().url('URL de LinkedIn inválida').optional().or(z.literal('')),
  personalWebsite: z.string().url('URL de sitio web inválida').optional().or(z.literal('')),
});

type FreelancerFormData = z.infer<typeof freelancerSchema>;

interface FreelancerFormProps {
  initialData?: Partial<FreelancerRegistrationData>;
  mode?: 'create' | 'edit';
  onSave?: (data: FreelancerFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showDisclaimerValidation?: boolean;
}

// Opciones predefinidas
const PROFESSIONAL_TYPES = [
  { value: 'immigration_attorney', label: 'Abogado de Inmigración' },
  { value: 'form_preparer', label: 'Preparador de Formularios' },
];

const BUSINESS_ENTITY_TYPES = [
  { value: 'sole_proprietor', label: 'Propietario Único' },
  { value: 'llc_single_member', label: 'LLC de Un Miembro' },
  { value: 'llc_multi_member', label: 'LLC de Múltiples Miembros' },
  { value: 'c_corp', label: 'Corporación C' },
  { value: 's_corp', label: 'Corporación S' },
];

const SPECIALTIES = [
  { value: 'asylum', label: 'Asilo' },
  { value: 'tps', label: 'TPS' },
  { value: 'daca', label: 'DACA' },
  { value: 'adjustment_status_i485', label: 'Ajuste de Estatus (I-485)' },
  { value: 'family_petitions_i130', label: 'Peticiones Familiares (I-130)' },
  { value: 'employment_petitions_i140', label: 'Peticiones de Empleo (I-140)' },
  { value: 'work_permit_i765', label: 'Permiso de Trabajo (I-765)' },
  { value: 'naturalization', label: 'Naturalización' },
  { value: 'deportation_defense', label: 'Defensa contra Deportación' },
  { value: 'vawa', label: 'VAWA' },
  { value: 'u_visa', label: 'Visa U' },
  { value: 't_visa', label: 'Visa T' },
  { value: 'other', label: 'Otro' },
];

const LANGUAGES = [
  { value: 'english', label: 'Inglés' },
  { value: 'spanish', label: 'Español' },
  { value: 'mandarin', label: 'Mandarín' },
  { value: 'cantonese', label: 'Cantonés' },
  { value: 'tagalog', label: 'Tagalo' },
  { value: 'vietnamese', label: 'Vietnamita' },
  { value: 'korean', label: 'Coreano' },
  { value: 'french', label: 'Francés' },
  { value: 'haitian_creole', label: 'Criollo Haitiano' },
  { value: 'portuguese', label: 'Portugués' },
  { value: 'arabic', label: 'Árabe' },
  { value: 'russian', label: 'Ruso' },
  { value: 'other', label: 'Otro' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function FreelancerForm({
  initialData,
  mode = 'create',
  onSave,
  onCancel,
  isLoading = false,
  showDisclaimerValidation = true
}: FreelancerFormProps) {
  const [customSpecialties, setCustomSpecialties] = useState<string[]>(
    initialData?.customSpecialties || []
  );
  const [customLanguages, setCustomLanguages] = useState<string[]>(
    initialData?.customLanguages || []
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<FreelancerFormData>({
    resolver: zodResolver(freelancerSchema),
    defaultValues: {
      professionalType: initialData?.professionalType || 'form_preparer',
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      primaryState: initialData?.primaryState || '',
      primaryCity: initialData?.primaryCity || '',
      barNumber: initialData?.barNumber || '',
      primaryBarState: initialData?.primaryBarState || '',
      additionalBarStates: initialData?.additionalBarStates || [],
      specialties: initialData?.specialties || [],
      businessLicenseNumber: initialData?.businessLicenseNumber || '',
      disclaimerAccepted: initialData?.disclaimerAccepted || false,
      hasBusiness: initialData?.hasBusiness || false,
      businessName: initialData?.businessName || '',
      businessEntityType: initialData?.businessEntityType || 'sole_proprietor',
      businessWebsite: initialData?.businessWebsite || '',
      profilePhotoUrl: initialData?.profilePhotoUrl || '',
      bio: initialData?.bio || '',
      yearsExperience: initialData?.yearsExperience || 0,
      languages: initialData?.languages || [],
      officeAddress: initialData?.officeAddress || '',
      officeCity: initialData?.officeCity || '',
      officeState: initialData?.officeState || '',
      officeZipCode: initialData?.officeZipCode || '',
      linkedinUrl: initialData?.linkedinUrl || '',
      personalWebsite: initialData?.personalWebsite || '',
    }
  });

  const watchedProfessionalType = watch('professionalType');
  const watchedHasBusiness = watch('hasBusiness');
  const watchedDisclaimerAccepted = watch('disclaimerAccepted');

  const isAttorney = watchedProfessionalType === 'immigration_attorney';
  const isFormPreparer = watchedProfessionalType === 'form_preparer';

  // Validación de disclaimer para form preparers
  const canSubmit = !showDisclaimerValidation ||
                   !isFormPreparer ||
                   watchedDisclaimerAccepted;

  const handleFormSubmit = async (data: FreelancerFormData) => {
    try {
      // Validación adicional para form preparers
      if (isFormPreparer && !data.disclaimerAccepted && showDisclaimerValidation) {
        toast.error('Debes aceptar el disclaimer para continuar como preparador de formularios');
        return;
      }

      const formData = {
        ...data,
        customSpecialties,
        customLanguages
      };

      if (onSave) {
        await onSave(formData);
        toast.success(
          mode === 'create'
            ? 'Perfil de freelancer creado exitosamente'
            : 'Perfil actualizado exitosamente'
        );
      }
    } catch (error) {
      console.error('Form submit error:', error);
      toast.error('Error al guardar los datos');
    }
  };

  const addCustomSpecialty = (specialty: string) => {
    if (specialty.trim() && !customSpecialties.includes(specialty.trim())) {
      setCustomSpecialties([...customSpecialties, specialty.trim()]);
    }
  };

  const removeCustomSpecialty = (specialty: string) => {
    setCustomSpecialties(customSpecialties.filter(s => s !== specialty));
  };

  const addCustomLanguage = (language: string) => {
    if (language.trim() && !customLanguages.includes(language.trim())) {
      setCustomLanguages([...customLanguages, language.trim()]);
    }
  };

  const removeCustomLanguage = (language: string) => {
    setCustomLanguages(customLanguages.filter(l => l !== language));
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Tipo de Profesional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5" />
            <span>Tipo de Profesional</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="professionalType">Tipo de Profesional *</Label>
            <Select
              value={watch('professionalType')}
              onValueChange={(value) => setValue('professionalType', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROFESSIONAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.professionalType && (
              <p className="text-sm text-red-600 mt-1">{errors.professionalType.message}</p>
            )}
          </div>

          {isFormPreparer && showDisclaimerValidation && (
            <Alert className="mt-4 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium text-amber-800">
                    Declaración Importante para Preparadores de Formularios
                  </p>
                  <p className="text-sm text-amber-700">
                    Como preparador de formularios, debo cumplir con todas las regulaciones federales
                    aplicables y entiendo que no puedo proporcionar asesoramiento legal.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="disclaimerAccepted"
                      checked={watchedDisclaimerAccepted}
                      onCheckedChange={(checked) => setValue('disclaimerAccepted', !!checked)}
                    />
                    <Label htmlFor="disclaimerAccepted" className="text-sm font-medium text-amber-800">
                      Acepto y entiendo esta declaración *
                    </Label>
                  </div>
                  {isFormPreparer && !watchedDisclaimerAccepted && (
                    <Alert variant="destructive" className="mt-2">
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Debes aceptar la declaración para continuar como preparador de formularios.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Información Personal</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                {...register('fullName')}
                placeholder="Juan Pérez"
              />
              {errors.fullName && (
                <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="juan@ejemplo.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="yearsExperience">Años de Experiencia</Label>
              <Input
                id="yearsExperience"
                type="number"
                min="0"
                {...register('yearsExperience', { valueAsNumber: true })}
                placeholder="5"
              />
            </div>

            <div>
              <Label htmlFor="profilePhotoUrl">URL de Foto de Perfil</Label>
              <Input
                id="profilePhotoUrl"
                type="url"
                {...register('profilePhotoUrl')}
                placeholder="https://ejemplo.com/foto.jpg"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Biografía Profesional</Label>
            <Textarea
              id="bio"
              {...register('bio')}
              placeholder="Describe tu experiencia y servicios..."
              rows={4}
            />
            {errors.bio && (
              <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ubicación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Ubicación</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryState">Estado Principal</Label>
              <Select
                value={watch('primaryState') || ''}
                onValueChange={(value) => setValue('primaryState', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="primaryCity">Ciudad Principal</Label>
              <Input
                id="primaryCity"
                {...register('primaryCity')}
                placeholder="Miami"
              />
            </div>
          </div>

          <Separator />

          <h4 className="font-medium">Dirección de Oficina (Opcional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="officeAddress">Dirección</Label>
              <Input
                id="officeAddress"
                {...register('officeAddress')}
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <Label htmlFor="officeCity">Ciudad</Label>
              <Input
                id="officeCity"
                {...register('officeCity')}
                placeholder="Miami"
              />
            </div>

            <div>
              <Label htmlFor="officeState">Estado</Label>
              <Select
                value={watch('officeState') || ''}
                onValueChange={(value) => setValue('officeState', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="officeZipCode">Código Postal</Label>
              <Input
                id="officeZipCode"
                {...register('officeZipCode')}
                placeholder="33101"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licencias y Certificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Licencias y Certificaciones</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Para abogados */}
          {isAttorney && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium text-blue-900 mb-3">Información de Licencia Legal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="barNumber">Número de Licencia Principal</Label>
                  <Input
                    id="barNumber"
                    {...register('barNumber')}
                    placeholder="123456"
                  />
                </div>

                <div>
                  <Label htmlFor="primaryBarState">Estado de Licencia Principal</Label>
                  <Select
                    value={watch('primaryBarState') || ''}
                    onValueChange={(value) => setValue('primaryBarState', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Estados de Licencia Adicionales</Label>
                  <MultiSelectInput
                    options={US_STATES.map(state => ({ value: state, label: state }))}
                    value={watch('additionalBarStates') || []}
                    onChange={(values) => setValue('additionalBarStates', values)}
                    placeholder="Selecciona estados adicionales"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Para preparadores de formularios */}
          {isFormPreparer && (
            <div className="border rounded-lg p-4 bg-green-50">
              <h4 className="font-medium text-green-900 mb-3">Licencia de Negocio</h4>
              <div>
                <Label htmlFor="businessLicenseNumber">Número de Licencia de Negocio</Label>
                <Input
                  id="businessLicenseNumber"
                  {...register('businessLicenseNumber')}
                  placeholder="BL-123456"
                />
                <p className="text-sm text-green-700 mt-1">
                  Requerido en algunos estados para preparadores de formularios
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Especialidades */}
      <Card>
        <CardHeader>
          <CardTitle>Especialidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Especialidades</Label>
            <MultiSelectInput
              options={SPECIALTIES}
              value={watch('specialties') || []}
              onChange={(values) => setValue('specialties', values)}
              placeholder="Selecciona especialidades"
            />
          </div>

          <div>
            <Label>Especialidades Adicionales</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {customSpecialties.map((specialty, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeCustomSpecialty(specialty)}
                >
                  {specialty} ×
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Agrega especialidad personalizada y presiona Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomSpecialty(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Idiomas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Idiomas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Idiomas</Label>
            <MultiSelectInput
              options={LANGUAGES}
              value={watch('languages') || []}
              onChange={(values) => setValue('languages', values)}
              placeholder="Selecciona idiomas"
            />
          </div>

          <div>
            <Label>Idiomas Adicionales</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {customLanguages.map((language, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeCustomLanguage(language)}
                >
                  {language} ×
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Agrega idioma adicional y presiona Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomLanguage(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Información de Negocio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Información de Negocio</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasBusiness"
              checked={watchedHasBusiness}
              onCheckedChange={(checked) => setValue('hasBusiness', !!checked)}
            />
            <Label htmlFor="hasBusiness">Tengo un negocio registrado</Label>
          </div>

          {watchedHasBusiness && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Nombre del Negocio</Label>
                  <Input
                    id="businessName"
                    {...register('businessName')}
                    placeholder="ABC Legal Services LLC"
                  />
                </div>

                <div>
                  <Label htmlFor="businessEntityType">Tipo de Entidad</Label>
                  <Select
                    value={watch('businessEntityType') || ''}
                    onValueChange={(value) => setValue('businessEntityType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_ENTITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="businessWebsite">Sitio Web del Negocio</Label>
                  <Input
                    id="businessWebsite"
                    type="url"
                    {...register('businessWebsite')}
                    placeholder="https://mi-negocio.com"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enlaces Profesionales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ExternalLink className="h-5 w-5" />
            <span>Enlaces Profesionales</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn</Label>
              <Input
                id="linkedinUrl"
                type="url"
                {...register('linkedinUrl')}
                placeholder="https://linkedin.com/in/usuario"
              />
            </div>

            <div>
              <Label htmlFor="personalWebsite">Sitio Web Personal</Label>
              <Input
                id="personalWebsite"
                type="url"
                {...register('personalWebsite')}
                placeholder="https://mi-sitio.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading || !canSubmit}
        >
          {isLoading
            ? 'Guardando...'
            : mode === 'create'
              ? 'Crear Perfil de Freelancer'
              : 'Guardar Cambios'
          }
        </Button>
      </div>

      {!canSubmit && isFormPreparer && showDisclaimerValidation && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Debes aceptar la declaración para continuar como preparador de formularios.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}