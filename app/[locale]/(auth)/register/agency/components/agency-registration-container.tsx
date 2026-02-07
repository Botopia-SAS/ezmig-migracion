'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AgencyRegistrationForm } from '@/components/agencies';
import type { AgencyRegistrationData } from '@/lib/db/schema';

interface AgencyRegistrationContainerProps {
  userId: number;
  preselectedType?: 'law_firm' | 'immigration_services';
  inviteCode?: string;
  locale: string;
}

export function AgencyRegistrationContainer({
  userId,
  preselectedType,
  inviteCode,
  locale
}: AgencyRegistrationContainerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: AgencyRegistrationData) => {
    setIsSubmitting(true);

    try {
      const registrationPayload = {
        ...data,
        userId,
        inviteCode: inviteCode || undefined,
      };

      const response = await fetch('/api/agencies/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error en el registro');
      }

      // Registro exitoso
      setIsSuccess(true);

      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 3000);

    } catch (error) {
      console.error('Registration error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al registrar la agencia. Intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  // Pantalla de éxito
  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-green-900 mb-4">
              ¡Registro Exitoso!
            </h1>

            <div className="space-y-4 text-green-800">
              <p className="text-lg">
                Tu agencia ha sido registrada correctamente en EZMig.
              </p>

              <div className="bg-white/60 rounded-lg p-4 space-y-2">
                <p className="font-medium">Próximos pasos:</p>
                <ul className="text-sm space-y-1 text-left max-w-md mx-auto">
                  <li>• Recibirás un email de confirmación en los próximos minutos</li>
                  <li>• Tu agencia será revisada por nuestro equipo (24-48 horas)</li>
                  <li>• Una vez aprobada, podrás comenzar a usar todas las funciones</li>
                  <li>• Mientras tanto, puedes explorar el dashboard y completar tu perfil</li>
                </ul>
              </div>

              <p className="text-sm">
                Redirigiendo al dashboard...
              </p>
            </div>

            <div className="mt-6">
              <Button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="bg-green-600 hover:bg-green-700"
              >
                Ir al Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulario de registro
  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </Button>
      </div>

      {inviteCode && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs text-blue-600">
                  Código de invitación:
                </p>
                <p className="font-mono text-sm text-blue-800">
                  {inviteCode}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AgencyRegistrationForm
        initialData={{
          agencyType: preselectedType,
        }}
        mode="register"
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      {/* Información adicional */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Información importante sobre el registro
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Proceso de aprobación</h4>
              <ul className="space-y-1">
                <li>• Revisión automática de datos básicos</li>
                <li>• Verificación manual por nuestro equipo</li>
                <li>• Notificación por email del resultado</li>
                <li>• Tiempo estimado: 24-48 horas hábiles</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Mientras esperas</h4>
              <ul className="space-y-1">
                <li>• Explora el dashboard y las funciones básicas</li>
                <li>• Completa tu perfil de agencia</li>
                <li>• Revisa la documentación de la API</li>
                <li>• Configura tu equipo y permisos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}