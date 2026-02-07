'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Users,
  User,
  ArrowRight,
  CheckCircle,
  Info,
  Briefcase,
  Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileTypeOption {
  id: 'agency' | 'team_member' | 'freelancer';
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  badge?: string;
  recommended?: boolean;
  comingSoon?: boolean;
}

interface ProfileTypeSelectorProps {
  onSelect: (profileType: 'agency' | 'team_member' | 'freelancer') => void;
  selectedType?: 'agency' | 'team_member' | 'freelancer' | null;
  showDescription?: boolean;
  className?: string;
}

const PROFILE_TYPES: ProfileTypeOption[] = [
  {
    id: 'agency',
    title: 'Agencia Legal / Bufete',
    description: 'Para oficinas legales, bufetes y agencias de inmigración con múltiples empleados',
    icon: Building2,
    features: [
      'Gestión de múltiples casos',
      'Equipo de abogados y staff',
      'Dashboard administrativo completo',
      'Facturación y pagos centralizados',
      'Control de permisos por rol',
      'Reportes y analytics'
    ],
    badge: 'Más Popular',
    recommended: true
  },
  {
    id: 'freelancer',
    title: 'Profesional Independiente',
    description: 'Para abogados de inmigración y preparadores de formularios que trabajan de forma independiente',
    icon: User,
    features: [
      'Perfil público en directorio',
      'Gestión de casos personales',
      'Herramientas de preparación de formularios',
      'Búsqueda de clientes',
      'Validación de documentos',
      'Comunicación directa con clientes'
    ],
    badge: 'Ideal para Freelancers'
  },
  {
    id: 'team_member',
    title: 'Miembro de Equipo',
    description: 'Para empleados que se unen a una agencia existente como abogados, paralegales o asistentes',
    icon: Users,
    features: [
      'Invitación por parte de la agencia',
      'Acceso limitado según rol asignado',
      'Colaboración en casos del equipo',
      'Herramientas específicas del rol',
      'Seguimiento de actividades',
      'Comunicación interna'
    ],
    comingSoon: true
  }
];

export function ProfileTypeSelector({
  onSelect,
  selectedType,
  showDescription = true,
  className
}: ProfileTypeSelectorProps) {
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const handleSelect = (profileType: 'agency' | 'team_member' | 'freelancer') => {
    // Prevenir selección de tipos que vienen próximamente
    const option = PROFILE_TYPES.find(opt => opt.id === profileType);
    if (option?.comingSoon) {
      return;
    }

    onSelect(profileType);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {showDescription && (
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            ¿Qué tipo de perfil necesitas?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Selecciona el tipo de perfil que mejor describa tu situación.
            Podrás cambiar esto más adelante si es necesario.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PROFILE_TYPES.map((option) => (
          <Card
            key={option.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg",
              selectedType === option.id && "ring-2 ring-blue-500 shadow-lg",
              option.recommended && "border-blue-200",
              option.comingSoon && "opacity-60 cursor-not-allowed"
            )}
            onMouseEnter={() => setHoveredType(option.id)}
            onMouseLeave={() => setHoveredType(null)}
            onClick={() => handleSelect(option.id)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-3 rounded-lg",
                    option.recommended ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600",
                    selectedType === option.id && "bg-blue-500 text-white"
                  )}>
                    <option.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                  </div>
                </div>

                {selectedType === option.id && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
              </div>

              {(option.badge || option.comingSoon) && (
                <div className="flex gap-2">
                  {option.badge && (
                    <Badge variant={option.recommended ? "default" : "secondary"} className="text-xs">
                      {option.badge}
                    </Badge>
                  )}
                  {option.comingSoon && (
                    <Badge variant="outline" className="text-xs">
                      Próximamente
                    </Badge>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                {option.description}
              </p>

              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-900">Características:</h4>
                <ul className="space-y-1">
                  {option.features.slice(0, hoveredType === option.id ? option.features.length : 3).map((feature, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-center space-x-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {hoveredType !== option.id && option.features.length > 3 && (
                    <li className="text-xs text-gray-400 italic">
                      +{option.features.length - 3} más...
                    </li>
                  )}
                </ul>
              </div>

              {option.comingSoon && (
                <Alert className="mt-4 border-amber-200 bg-amber-50">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-700">
                    Esta funcionalidad estará disponible próximamente.
                    Mientras tanto, puedes registrarte como Agencia.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedType && (
        <div className="flex justify-center">
          <Button
            onClick={() => handleSelect(selectedType)}
            size="lg"
            className="flex items-center space-x-2"
            disabled={PROFILE_TYPES.find(opt => opt.id === selectedType)?.comingSoon}
          >
            <span>Continuar como {PROFILE_TYPES.find(opt => opt.id === selectedType)?.title}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Información adicional */}
      <div className="text-center">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-700">
            <strong>¿No estás seguro?</strong> Puedes cambiar el tipo de perfil más adelante
            desde la configuración de tu cuenta. Empezar con Agencia es lo más versátil.
          </AlertDescription>
        </Alert>
      </div>

      {/* Comparación rápida */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <Scale className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-900">Agencia / Bufete</span>
          </div>
          <p className="text-green-700">
            Ideal si tienes empleados, manejas múltiples casos o planeas crecer tu práctica legal.
          </p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2 mb-2">
            <Briefcase className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-purple-900">Freelancer</span>
          </div>
          <p className="text-purple-700">
            Perfecto si trabajas solo, quieres ser encontrado por clientes o necesitas herramientas básicas.
          </p>
        </div>
      </div>
    </div>
  );
}