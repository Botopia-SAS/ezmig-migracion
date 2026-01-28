import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import { locales, type Locale } from '@/i18n/config';
import { BackgroundGrid } from '@/components/background-grid';
import { Toaster } from '@/components/ui/sonner';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Serialize data for SWR fallback - must use JSON to convert Date objects to ISO strings
// Note: structuredClone preserves Dates which causes SWR serialization errors
const serializeForSWR = <T,>(data: T): T =>
  data == null ? data : JSON.parse(JSON.stringify(data));

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages and user data
  const [messages, user, team] = await Promise.all([
    getMessages(),
    getUser(),
    getTeamForUser(),
  ]);

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-gray-950 text-black dark:text-white bg-grid-soft">
      <BackgroundGrid />
      <NextIntlClientProvider messages={messages} locale={locale}>
        <SWRConfig
          value={{
            fallback: {
              '/api/user': serializeForSWR(user),
              '/api/team': serializeForSWR(team),
            }
          }}
        >
          {children}
        </SWRConfig>
        <Toaster position="top-right" richColors closeButton />
      </NextIntlClientProvider>
    </div>
  );
}
