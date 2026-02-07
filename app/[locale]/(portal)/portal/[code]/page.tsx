'use client';

import { use } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Shield,
  Clock,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LanguageSwitcher } from '@/components/language-switcher';

interface FormTypeInfo {
  id: number;
  code: string;
  name: string;
  category: string | null;
}

interface ReferralLinkInfo {
  id: number;
  code: string;
  teamId: number;
  teamName: string;
  teamLogoUrl: string | null;
  caseId: number | null;
  formTypeIds: number[];
  isValid: boolean;
  invalidReason?: string;
  formTypes: FormTypeInfo[];
  case?: {
    caseNumber: string | null;
    caseType: string;
  };
}

interface ReferralResponse {
  link: ReferralLinkInfo;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-full max-w-sm px-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}

function InvalidLink({ reason, t }: { reason?: string; t: (key: string) => string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="rounded-full bg-red-100 p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {t('invalid.title')}
        </h2>
        <p className="text-gray-500 mb-6">
          {reason || t('invalid.description')}
        </p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
          <Link href="/">{t('invalid.backHome')}</Link>
        </Button>
      </div>
    </div>
  );
}

export default function PortalLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const t = useTranslations('portal');

  const { data, error, isLoading } = useSWR<ReferralResponse>(
    `/api/referrals/code/${code}`,
    fetcher
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !data?.link) {
    return <InvalidLink t={t} />;
  }

  const { link } = data;

  if (!link.isValid) {
    return <InvalidLink reason={link.invalidReason} t={t} />;
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left side — Content (scrollable) */}
      <div className="w-full lg:w-[42%] xl:w-[38%] flex flex-col px-4 sm:px-6 lg:px-16 xl:px-20 overflow-y-auto">
        {/* Back to home */}
        <div className="pt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('invalid.backHome')}
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center py-12">
          <div className="w-full max-w-sm">
            {/* Logo + Language */}
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="flex items-center gap-2">
                <img
                  src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
                  alt="EZMig"
                  className="h-9 w-auto"
                />
                <span className="text-xl font-bold text-gray-900">EZMig</span>
              </Link>
              <LanguageSwitcher />
            </div>

            {/* Valid link badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-medium mb-5">
              <CheckCircle className="h-3.5 w-3.5" />
              {t('welcome.validLink')}
            </div>

            {/* Welcome */}
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {t('welcome.title', { teamName: link.teamName })}
            </h1>
            <p className="text-gray-500 mb-8">
              {t('welcome.subtitle')}
            </p>

            {/* Form types */}
            {link.formTypes && link.formTypes.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {t('forms.title')}
                </p>
                <div className="space-y-2">
                  {link.formTypes.map((ft) => (
                    <div
                      key={ft.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="rounded-lg bg-violet-100 p-1.5">
                        <FileText className="h-4 w-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ft.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{ft.code}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Register CTA */}
            <Button
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium mb-4"
              asChild
            >
              <Link href={`/portal/${code}/register`}>
                {t('register.cta.button')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            {/* Divider with sign-in */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t('login.cta.title')}
                </span>
              </div>
            </div>

            <Link
              href="/sign-in"
              className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
            >
              {t('login.cta.button')}
            </Link>

            {/* Help */}
            <p className="mt-8 text-center text-xs text-gray-500">
              {t('help.text')}{' '}
              <a href={`mailto:support@${link.teamName.toLowerCase().replace(/\s+/g, '')}.com`} className="text-indigo-600 hover:text-indigo-500">
                {t('help.contact')}
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right side — Premium visual */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[62%] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 items-center justify-center p-16 relative overflow-hidden">
        {/* Background blurs */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 max-w-lg w-full">
          {/* Floating cards */}
          <div className="relative h-72 mb-8">
            {/* Main card — Team branding */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white rounded-2xl shadow-2xl p-5 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{link.teamName}</p>
                  <p className="text-xs text-gray-500">{t('welcome.subtitle')}</p>
                </div>
              </div>
              <div className="space-y-2">
                {link.formTypes?.slice(0, 2).map((ft) => (
                  <div key={ft.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-violet-100 rounded flex items-center justify-center">
                      <FileText className="w-3 h-3 text-violet-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 truncate">{ft.name}</span>
                  </div>
                ))}
                {(link.formTypes?.length || 0) > 2 && (
                  <p className="text-xs text-gray-400 text-center">+{link.formTypes!.length - 2} more</p>
                )}
              </div>
            </div>

            {/* Trust card — Left */}
            <div className="absolute -left-4 top-4 w-48 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Secure Portal</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">256-bit</span>
                <span className="text-xs text-gray-500">encryption</span>
              </div>
            </div>

            {/* Status card — Right */}
            <div className="absolute -right-4 bottom-4 w-44 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 transform rotate-6 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">Ready to start</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gray-900">{link.formTypes?.length || 0}</span>
                <span className="text-xs text-gray-500">forms to complete</span>
              </div>
            </div>
          </div>

          {/* Text content */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('register.cta.title')}
            </h2>
            <p className="text-indigo-200 text-lg leading-relaxed mb-8">
              {t('register.cta.description')}
            </p>

            {/* Feature row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-4 h-4 text-indigo-300" />
                </div>
                <p className="text-xs text-indigo-300">Secure & Private</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-4 h-4 text-indigo-300" />
                </div>
                <p className="text-xs text-indigo-300">Save Progress</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <User className="w-4 h-4 text-indigo-300" />
                </div>
                <p className="text-xs text-indigo-300">Direct Access</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
