'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ReferralLinkInfo {
  id: number;
  code: string;
  teamName: string;
  isValid: boolean;
  invalidReason?: string;
  client?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ReferralResponse {
  link: ReferralLinkInfo;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
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

export default function PortalRegisterPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const t = useTranslations('portal');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data, error, isLoading } = useSWR<ReferralResponse>(
    `/api/referrals/code/${code}`,
    fetcher
  );

  // Pre-fill email if client exists
  const clientEmail = data?.link?.client?.email;
  const clientName = data?.link?.client
    ? `${data.link.client.firstName} ${data.link.client.lastName}`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t('register.errors.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      toast.error(t('register.errors.passwordTooShort'));
      return;
    }

    setIsSubmitting(true);

    try {
      // First validate the referral code
      const validateResponse = await fetch(`/api/referrals/code/${code}`, {
        method: 'POST',
      });

      const validation = await validateResponse.json();

      if (!validation.valid) {
        toast.error(validation.reason || t('register.errors.invalidLink'));
        return;
      }

      // Then register the user with the referral code
      const registerResponse = await fetch('/api/auth/register-with-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email || clientEmail,
          password,
          name: name || clientName,
          referralCode: code,
        }),
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        throw new Error(error.error || t('register.errors.generic'));
      }

      setIsSuccess(true);
      toast.success(t('register.success'));

      // Redirect to portal after a short delay
      setTimeout(() => {
        router.push(`/portal/${code}`);
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('register.errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <div className="rounded-full bg-green-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              {t('register.successTitle')}
            </h2>
            <p className="text-green-700 mb-4">
              {t('register.successDescription')}
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href={`/portal/${code}`}>{t('register.continueToPortal')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href={`/portal/${code}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('register.back')}
        </Link>
      </Button>

      <Card>
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-violet-100 mx-auto mb-4 flex items-center justify-center">
            <img
              src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
              alt="EZMig"
              className="h-8 w-8"
            />
          </div>
          <CardTitle>{t('register.title')}</CardTitle>
          <CardDescription>
            {t('register.subtitle', { teamName: link.teamName })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('register.name')}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('register.namePlaceholder')}
                value={name || clientName}
                onChange={(e) => setName(e.target.value)}
                disabled={!!clientName}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('register.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('register.emailPlaceholder')}
                value={email || clientEmail || ''}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!clientEmail}
                required
              />
              {clientEmail && (
                <p className="text-xs text-gray-500">
                  {t('register.emailPrefilled')}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">{t('register.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('register.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {t('register.passwordHint')}
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('register.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('register.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('register.submitting')}
                </>
              ) : (
                t('register.submit')
              )}
            </Button>
          </form>

          {/* Already have account */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              {t('register.alreadyHaveAccount')}{' '}
              <Link href="/sign-in" className="text-violet-600 hover:underline">
                {t('register.signIn')}
              </Link>
            </p>
          </div>

          {/* Terms */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>
              {t('register.termsText')}{' '}
              <Link href="/terms" className="text-violet-600 hover:underline">
                {t('register.termsLink')}
              </Link>{' '}
              {t('register.andText')}{' '}
              <Link href="/privacy" className="text-violet-600 hover:underline">
                {t('register.privacyLink')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
