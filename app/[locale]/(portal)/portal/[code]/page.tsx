'use client';

import { use } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  AlertTriangle,
  User,
  Briefcase,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface ReferralLinkInfo {
  id: number;
  code: string;
  teamId: number;
  teamName: string;
  clientId: number | null;
  caseId: number | null;
  allowedForms: number[] | null;
  isValid: boolean;
  invalidReason?: string;
  client?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  case?: {
    caseNumber: string | null;
    caseType: string;
  };
  forms?: {
    id: number;
    code: string;
    name: string;
    status: string;
    progressPercentage: number;
  }[];
}

interface ReferralResponse {
  link: ReferralLinkInfo;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InvalidLink({ reason, t }: { reason?: string; t: (key: string) => string }) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 text-center">
          <div className="rounded-full bg-red-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            {t('invalid.title')}
          </h2>
          <p className="text-red-700 mb-4">
            {reason || t('invalid.description')}
          </p>
          <Button asChild variant="outline">
            <Link href="/">{t('invalid.backHome')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FormCard({
  form,
  code,
  t,
}: {
  form: { id: number; code: string; name: string; status: string; progressPercentage: number };
  code: string;
  t: (key: string) => string;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_started':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            {t('formStatus.notStarted')}
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            {t('formStatus.inProgress')}
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('formStatus.completed')}
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-purple-100 text-purple-700">
            {t('formStatus.submitted')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getActionButton = (status: string) => {
    if (status === 'submitted') {
      return (
        <Button disabled variant="outline" size="sm">
          {t('formActions.view')}
        </Button>
      );
    }
    if (status === 'completed') {
      return (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/portal/${code}/forms/${form.id}`}>
            {t('formActions.review')}
          </Link>
        </Button>
      );
    }
    return (
      <Button
        size="sm"
        className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
        asChild
      >
        <Link href={`/portal/${code}/forms/${form.id}`}>
          {status === 'not_started' ? t('formActions.start') : t('formActions.continue')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    );
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-violet-100 p-2">
          <FileText className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h4 className="font-medium">{form.name}</h4>
          <p className="text-sm text-gray-500">{form.code}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {form.status === 'in_progress' && (
          <div className="text-sm text-gray-500">
            {form.progressPercentage}%
          </div>
        )}
        {getStatusBadge(form.status)}
        {getActionButton(form.status)}
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
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 rounded-full text-violet-700 text-sm font-medium mb-4">
          <CheckCircle className="h-4 w-4" />
          {t('welcome.validLink')}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('welcome.title', { teamName: link.teamName })}
        </h1>
        <p className="text-gray-600">
          {t('welcome.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Client/Case Info */}
        {(link.client || link.case) && (
          <Card>
            <CardHeader>
              <CardTitle>{t('info.title')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {link.client && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('info.client')}</p>
                    <p className="font-medium">
                      {link.client.firstName} {link.client.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{link.client.email}</p>
                  </div>
                </div>
              )}
              {link.case && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-indigo-100 p-2">
                    <Briefcase className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('info.case')}</p>
                    <p className="font-medium">
                      {link.case.caseNumber || link.case.caseType}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Forms */}
        {link.forms && link.forms.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('forms.title')}</CardTitle>
              <CardDescription>
                {t('forms.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {link.forms.map((form) => (
                <FormCard key={form.id} form={form} code={code} t={t} />
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                {t('forms.empty')}
              </h3>
              <p className="text-sm text-gray-500">
                {t('forms.emptyDescription')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* CTA for Registration */}
        <Card className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white border-0">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {t('register.cta.title')}
                </h3>
                <p className="text-violet-100 text-sm">
                  {t('register.cta.description')}
                </p>
              </div>
              <Button
                variant="secondary"
                className="bg-white text-violet-600 hover:bg-violet-50"
                asChild
              >
                <Link href={`/portal/${code}/register`}>
                  {t('register.cta.button')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Already have account - Login option */}
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white p-2 border">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {t('login.cta.title')}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {t('login.cta.description')}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href="/sign-in">
                  {t('login.cta.button')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <div className="text-center text-sm text-gray-500">
          <p>
            {t('help.text')}{' '}
            <a href={`mailto:support@${link.teamName.toLowerCase().replace(/\s+/g, '')}.com`} className="text-violet-600 hover:underline">
              {t('help.contact')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
