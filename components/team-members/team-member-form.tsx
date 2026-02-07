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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelectInput } from '@/components/ui/multi-select-input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, User, Mail, Phone, Briefcase, Globe } from 'lucide-react';
import { toast } from 'sonner';
import type { TeamMemberRegistrationData } from '@/lib/db/schema';

// Schema de validación
const teamMemberSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos').optional(),
  role: z.enum(['attorney', 'paralegal', 'legal_assistant', 'admin_assistant', 'receptionist', 'other']),
  customRoleDescription: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  customSpecialties: z.array(z.string()).optional(),
  barNumber: z.string().optional(),
  barState: z.string().length(2, 'Código de estado debe ser de 2 letras').optional(),
  profilePhotoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio no puede exceder 500 caracteres').optional(),
  languages: z.array(z.string()).optional(),
  customLanguages: z.array(z.string()).optional(),
});

type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

interface TeamMemberFormProps {
  initialData?: Partial<TeamMemberRegistrationData>;
  mode?: 'create' | 'edit';
  agencyId: string;
  onSave?: (data: TeamMemberFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

// Opciones predefinidas
const TEAM_MEMBER_ROLES = [
  { value: 'attorney', label: 'Abogado' },
  { value: 'paralegal', label: 'Paralegal' },
  { value: 'legal_assistant', label: 'Asistente Legal' },
  { value: 'admin_assistant', label: 'Asistente Administrativo' },
  { value: 'receptionist', label: 'Recepcionista' },
  { value: 'other', label: 'Otro' },
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

export function TeamMemberForm({
  initialData,
  mode = 'create',
  agencyId,
  onSave,
  onCancel,
  isLoading = false
}: TeamMemberFormProps) {
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
  } = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      role: initialData?.role || 'legal_assistant',
      customRoleDescription: initialData?.customRoleDescription || '',
      specialties: initialData?.specialties || [],
      barNumber: initialData?.barNumber || '',
      barState: initialData?.barState || '',
      profilePhotoUrl: initialData?.profilePhotoUrl || '',
      bio: initialData?.bio || '',
      languages: initialData?.languages || [],
    }
  });

  const watchedRole = watch('role');
  const isAttorney = watchedRole === 'attorney';
  const isOtherRole = watchedRole === 'other';

  const handleFormSubmit = async (data: TeamMemberFormData) => {
    try {
      const formData = {
        ...data,
        customSpecialties,
        customLanguages
      };

      if (onSave) {
        await onSave(formData);
        toast.success(
          mode === 'create'
            ? 'Miembro del equipo creado exitosamente'
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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="profilePhotoUrl">URL de Foto de Perfil</Label>
              <Input
                id="profilePhotoUrl"
                type="url"
                {...register('profilePhotoUrl')}
                placeholder="https://ejemplo.com/foto.jpg"
              />
              {errors.profilePhotoUrl && (
                <p className="text-sm text-red-600 mt-1">{errors.profilePhotoUrl.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              {...register('bio')}
              placeholder="Descripción breve del miembro del equipo..."
              rows={3}
            />
            {errors.bio && (
              <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información Profesional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5" />
            <span>Información Profesional</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Rol en la Agencia *</Label>
              <Select
                value={watch('role')}
                onValueChange={(value) => setValue('role', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_MEMBER_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>
              )}
            </div>

            {isOtherRole && (
              <div>
                <Label htmlFor="customRoleDescription">Descripción del Rol</Label>
                <Input
                  id="customRoleDescription"
                  {...register('customRoleDescription')}
                  placeholder="Describe el rol específico"
                />
              </div>
            )}
          </div>

          {/* Campos específicos para abogados */}
          {isAttorney && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium text-blue-900 mb-3">Información de Licencia Legal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="barNumber">Número de Licencia</Label>
                  <Input
                    id="barNumber"
                    {...register('barNumber')}
                    placeholder="123456"
                  />
                </div>

                <div>
                  <Label htmlFor="barState">Estado de Licencia</Label>
                  <Select
                    value={watch('barState') || ''}
                    onValueChange={(value) => setValue('barState', value)}
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
              </div>
            </div>
          )}

          {/* Especialidades */}
          <div>
            <Label>Especialidades</Label>
            <MultiSelectInput
              options={SPECIALTIES}
              value={watch('specialties') || []}
              onChange={(values) => setValue('specialties', values)}
              placeholder="Selecciona especialidades"
            />
          </div>

          {/* Especialidades Personalizadas */}
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
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? 'Guardando...'
            : mode === 'create'
              ? 'Crear Miembro del Equipo'
              : 'Guardar Cambios'
          }
        </Button>
      </div>
    </form>
  );
}