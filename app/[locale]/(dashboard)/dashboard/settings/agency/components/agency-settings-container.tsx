'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Building,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Users,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { AgencyRegistrationForm } from '@/components/agencies';
import type { AgencyRegistrationData } from '@/lib/db/schema';

interface AgencySettingsContainerProps {
  agencyData: any; // TODO: Tipado correcto cuando esté implementado
  userRole: 'owner' | 'staff' | 'admin';
  locale: string;
}

export function AgencySettingsContainer({
  agencyData,
  userRole,
  locale
}: AgencySettingsContainerProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Status de la agencia
  const getStatusInfo = () => {
    switch (agencyData.agencyStatus) {
      case 'active':
        return {
          color: 'bg-green-500',
          text: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: CheckCircle,
          label: 'Activa',
          description: 'Tu agencia está completamente activa y verificada'
        };
      case 'pending':
        return {
          color: 'bg-amber-500',
          text: 'text-amber-700',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: Clock,
          label: 'Pendiente de Aprobación',
          description: 'Tu agencia está siendo revisada por nuestro equipo'
        };
      case 'suspended':
        return {
          color: 'bg-red-500',
          text: 'text-red-700',
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: AlertTriangle,
          label: 'Suspendida',
          description: 'Tu agencia ha sido suspendida temporalmente'
        };
      default:
        return {
          color: 'bg-gray-500',
          text: 'text-gray-700',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: Shield,
          label: 'Desconocido',
          description: 'Estado desconocido'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Manejar guardado de cambios
  const handleSave = async (data: Partial<AgencyRegistrationData>) => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/agencies/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al guardar los cambios');
      }

      toast.success('Cambios guardados correctamente');

      // TODO: Actualizar datos locales o revalidar
      // mutate('/api/agencies/settings');

    } catch (error) {
      console.error('Save error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al guardar los cambios'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Verificar permisos de edición
  const canEdit = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Status de la agencia */}
      <Card className={`${statusInfo.border} ${statusInfo.bg}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${statusInfo.bg}`}>
                <StatusIcon className={`h-6 w-6 ${statusInfo.text}`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {agencyData.legalBusinessName}
                </h2>
                <p className={`text-sm ${statusInfo.text}`}>
                  {statusInfo.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={agencyData.agencyStatus === 'active' ? 'default' : 'secondary'}>
                {statusInfo.label}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">
                Completitud: {agencyData.completionPercentage}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advertencias según permisos */}
      {!canEdit && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Solo el propietario de la agencia puede modificar esta información.
            Contacta a tu administrador si necesitas realizar cambios.
          </AlertDescription>
        </Alert>
      )}

      {agencyData.agencyStatus === 'pending' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Tu agencia está siendo revisada. Algunas funciones pueden estar limitadas hasta que sea aprobada.
            Tiempo estimado de revisión: 24-48 horas hábiles.
          </AlertDescription>
        </Alert>
      )}

      {agencyData.agencyStatus === 'suspended' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tu agencia ha sido suspendida. Contacta al soporte para más información: support@ezmig.com
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs de configuración */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Equipo</span>
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Legal</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Avanzado</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab General - Información de la agencia */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Agencia</CardTitle>
            </CardHeader>
            <CardContent>
              <AgencyRegistrationForm
                initialData={agencyData}
                mode="settings"
                onSave={canEdit ? handleSave : undefined}
                isLoading={isSaving}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Equipo */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión del Equipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>La gestión de equipo estará disponible próximamente.</p>
                <p className="text-sm mt-2">
                  Podrás invitar miembros, asignar roles y gestionar permisos.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Legal */}
        <TabsContent value="legal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Legal y Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Disclaimer status */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Declaración Legal</h3>
                    <p className="text-sm text-gray-600">
                      Estado de aceptación de los términos legales
                    </p>
                  </div>
                  <Badge variant={agencyData.disclaimerAccepted ? 'default' : 'destructive'}>
                    {agencyData.disclaimerAccepted ? 'Aceptada' : 'Pendiente'}
                  </Badge>
                </div>

                {agencyData.disclaimerAccepted && agencyData.disclaimerAcceptedAt && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Aceptada el: {new Date(agencyData.disclaimerAcceptedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Licenses info para law firms */}
              {agencyData.agencyType === 'law_firm' && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="font-medium text-gray-900">Licencias y Registros</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Registro del Bufete</p>
                      <p className="text-sm text-gray-600">
                        {agencyData.firmRegistrationNumber || 'No especificado'}
                        {agencyData.firmRegistrationState && ` (${agencyData.firmRegistrationState})`}
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Licencia Comercial</p>
                      <p className="text-sm text-gray-600">
                        {agencyData.businessLicenseNumber || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Avanzado */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Configuración avanzada estará disponible próximamente.</p>
                <p className="text-sm mt-2">
                  Incluirá API keys, webhooks, integraciones y configuración de notificaciones.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Fecha de Registro</p>
              <p className="text-gray-900">
                {new Date(agencyData.createdAt).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Última Actualización</p>
              <p className="text-gray-900">
                {new Date(agencyData.updatedAt).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}