import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getAgencyById } from '@/lib/agencies/service';
import { AgencySettingsContainer } from './components/agency-settings-container';

export const metadata: Metadata = {
  title: 'Configuración de Agencia | EZMig',
  description: 'Administra la configuración y información de tu agencia de inmigración en EZMig.',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: {
    locale: string;
  };
}

export default async function AgencySettingsPage({
  params: { locale }
}: PageProps) {
  // Verificar autenticación
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=${encodeURIComponent(`/${locale}/dashboard/settings/agency`)}`);
  }

  // Validar locale
  const supportedLocales = ['en', 'es', 'pt'];
  if (!supportedLocales.includes(locale)) {
    notFound();
  }

  // TODO: Obtener agencia del usuario desde la base de datos
  // Por ahora, usar datos de placeholder hasta que esté implementado completamente
  const mockAgencyData = {
    id: 'placeholder-agency-id',
    agencyType: 'immigration_services' as const,
    agencyStatus: 'active' as const,
    completionPercentage: 75,
    legalBusinessName: 'Servicios de Inmigración Ejemplo',
    businessNameDba: 'Ejemplo Immigration',
    businessEmail: 'info@ejemplo.com',
    businessPhone: '(555) 123-4567',
    website: 'https://ejemplo.com',
    address: '123 Main Street',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90210',
    country: 'USA',
    ownerFullName: session.user.name || 'Usuario Ejemplo',
    ownerPosition: 'Director',
    ownerEmail: session.user.email || 'usuario@ejemplo.com',
    ownerPhone: '(555) 987-6543',
    disclaimerAccepted: true,
    disclaimerAcceptedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20')
  };

  // TODO: Verificar permisos del usuario para editar la agencia
  // const teamMember = await getTeamMemberByUserAndTeam(session.user.id, agencyData.id);
  // const userRole = teamMember?.role || 'staff';

  const userRole = 'owner'; // Placeholder

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Configuración de Agencia
        </h1>
        <p className="text-gray-600 mt-2">
          Administra la información y configuración de tu agencia
        </p>
      </div>

      {/* Contenedor principal */}
      <AgencySettingsContainer
        agencyData={mockAgencyData}
        userRole={userRole}
        locale={locale}
      />
    </div>
  );
}