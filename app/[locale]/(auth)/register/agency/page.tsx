import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { AgencyRegistrationContainer } from './components/agency-registration-container';

export const metadata: Metadata = {
  title: 'Registro de Agencia | EZMig',
  description: 'Registra tu agencia de inmigración o bufete de abogados en EZMig para comenzar a ayudar a tus clientes con sus procesos migratorios.',
  robots: {
    index: false, // No indexar páginas de registro
    follow: false,
  },
};

interface PageProps {
  params: {
    locale: string;
  };
  searchParams: {
    type?: 'law_firm' | 'immigration_services';
    invite?: string;
  };
}

export default async function AgencyRegistrationPage({
  params: { locale },
  searchParams
}: PageProps) {
  // Verificar que el usuario esté autenticado
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=${encodeURIComponent(`/${locale}/register/agency`)}`);
  }

  // TODO: Verificar que el usuario no tenga ya una agencia registrada
  // const existingAgency = await getAgencyByUserId(session.user.id);
  // if (existingAgency) {
  //   redirect(`/${locale}/dashboard`);
  // }

  // Validar locale
  const supportedLocales = ['en', 'es', 'pt'];
  if (!supportedLocales.includes(locale)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Main content */}
      <div className="relative">
        <div className="container mx-auto px-4 py-12">
          <AgencyRegistrationContainer
            user={session.user}
            preselectedType={searchParams.type}
            inviteCode={searchParams.invite}
            locale={locale}
          />
        </div>
      </div>

      {/* Footer with help links */}
      <footer className="relative bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
            <div className="mb-4 md:mb-0">
              <p>
                ¿Tienes problemas con el registro?{' '}
                <a
                  href="mailto:support@ezmig.com"
                  className="text-violet-600 hover:text-violet-700 font-medium"
                >
                  Contáctanos
                </a>
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="/terms"
                className="text-gray-500 hover:text-gray-700"
              >
                Términos de Servicio
              </a>
              <a
                href="/privacy"
                className="text-gray-500 hover:text-gray-700"
              >
                Política de Privacidad
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}