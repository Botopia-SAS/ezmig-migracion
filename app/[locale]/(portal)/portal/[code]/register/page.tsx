'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  Shield,
  Clock,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { LanguageSwitcher } from '@/components/language-switcher';
import { COUNTRIES } from '@/lib/constants/countries';

interface ReferralLinkInfo {
  id: number;
  code: string;
  teamName: string;
  isValid: boolean;
  invalidReason?: string;
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
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
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

function SuccessState({ t }: { t: (key: string) => string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="rounded-full bg-green-100 p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {t('register.successTitle')}
        </h2>
        <p className="text-gray-500 mb-6">
          {t('register.successDescription')}
        </p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
          <Link href="/dashboard/my-cases">
            {t('register.continueToPortal')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
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

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [countryOfBirth, setCountryOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [alienNumber, setAlienNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data, error, isLoading } = useSWR<ReferralResponse>(
    `/api/referrals/code/${code}`,
    fetcher
  );

  const handleNextStep = () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error(t('register.errors.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('register.errors.passwordMismatch'));
      return;
    }
    if (password.length < 8) {
      toast.error(t('register.errors.passwordTooShort'));
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const validateResponse = await fetch(`/api/referrals/code/${code}`, {
        method: 'POST',
      });

      const validation = await validateResponse.json();

      if (!validation.valid) {
        toast.error(validation.reason || t('register.errors.invalidLink'));
        return;
      }

      const registerResponse = await fetch('/api/auth/register-with-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          referralCode: code,
          ...(dateOfBirth && { dateOfBirth }),
          ...(countryOfBirth && { countryOfBirth }),
          ...(nationality && { nationality }),
          ...(alienNumber && { alienNumber }),
        }),
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        throw new Error(error.error || t('register.errors.generic'));
      }

      setIsSuccess(true);
      toast.success(t('register.success'));

      setTimeout(() => {
        router.push('/dashboard/my-cases');
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('register.errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data?.link) return <InvalidLink t={t} />;

  const { link } = data;

  if (!link.isValid) return <InvalidLink reason={link.invalidReason} t={t} />;
  if (isSuccess) return <SuccessState t={t} />;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left side — Form (scrollable) */}
      <div className="w-full lg:w-[42%] xl:w-[38%] flex flex-col px-4 sm:px-6 lg:px-16 xl:px-20 overflow-y-auto">
        {/* Back */}
        <div className="pt-8">
          {step === 1 ? (
            <Link href={`/portal/${code}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t('register.back')}
            </Link>
          ) : (
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t('register.back')}
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center py-8">
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

            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 flex-1">
                <div className="h-1.5 flex-1 rounded-full bg-indigo-600" />
                <div className={`h-1.5 flex-1 rounded-full ${step === 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              </div>
              <span className="text-xs text-gray-500">{step}/2</span>
            </div>

            {step === 1 ? (
              <>
                {/* Step 1 Header */}
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                  {t('register.title')}
                </h1>
                <p className="text-gray-500 mb-6">
                  {t('register.subtitle', { teamName: link.teamName })}
                </p>

                {/* Step 1 Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      {t('register.name')}
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={t('register.namePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="mt-1.5 h-11 rounded-lg border-gray-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      {t('register.email')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('register.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-1.5 h-11 rounded-lg border-gray-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      {t('register.password')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('register.passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="mt-1.5 h-11 rounded-lg border-gray-200 pr-12"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t('register.passwordHint')}</p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      {t('register.confirmPassword')}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t('register.confirmPasswordPlaceholder')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="mt-1.5 h-11 rounded-lg border-gray-200"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                  >
                    {t('register.continue')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {/* Already have account */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      {t('register.alreadyHaveAccount')}
                    </span>
                  </div>
                </div>

                <Link
                  href="/sign-in"
                  className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  {t('register.signIn')}
                </Link>
              </>
            ) : (
              <>
                {/* Step 2 Header */}
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                  {t('register.immigrationInfo')}
                </h1>
                <p className="text-gray-500 mb-6">
                  {t('register.immigrationInfoHint')}
                </p>

                {/* Step 2 Fields */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                      {t('register.dateOfBirth')}
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="mt-1.5 h-11 rounded-lg border-gray-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="countryOfBirth" className="text-sm font-medium text-gray-700">
                      {t('register.countryOfBirth')}
                    </Label>
                    <Select value={countryOfBirth} onValueChange={setCountryOfBirth}>
                      <SelectTrigger className="mt-1.5 h-11 rounded-lg border-gray-200">
                        <SelectValue placeholder={t('register.countryOfBirthPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.filter(c => c.code !== 'DIVIDER').map((country) => (
                          <SelectItem key={country.code} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="nationality" className="text-sm font-medium text-gray-700">
                      {t('register.nationality')}
                    </Label>
                    <Select value={nationality} onValueChange={setNationality}>
                      <SelectTrigger className="mt-1.5 h-11 rounded-lg border-gray-200">
                        <SelectValue placeholder={t('register.nationalityPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.filter(c => c.code !== 'DIVIDER').map((country) => (
                          <SelectItem key={country.code} value={country.nationality}>
                            {country.nationality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="alienNumber" className="text-sm font-medium text-gray-700">
                      {t('register.alienNumber')}
                    </Label>
                    <Input
                      id="alienNumber"
                      type="text"
                      placeholder="A-XXX-XXX-XXX"
                      value={alienNumber}
                      onChange={(e) => setAlienNumber(e.target.value)}
                      className="mt-1.5 h-11 rounded-lg border-gray-200"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        {t('register.submitting')}
                      </>
                    ) : (
                      t('register.submit')
                    )}
                  </Button>

                  <button
                    type="submit"
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {t('register.skipStep')}
                  </button>
                </form>
              </>
            )}

            <p className="mt-6 text-center text-xs text-gray-500">
              {t('register.termsText')}{' '}
              <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">{t('register.termsLink')}</Link>
              {' '}{t('register.andText')}{' '}
              <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">{t('register.privacyLink')}</Link>
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
            {/* Main card */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white rounded-2xl shadow-2xl p-5 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{link.teamName}</p>
                  <p className="text-xs text-gray-500">{t('register.title')}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-indigo-600 font-medium">Step {step} of 2</span>
                  <span className="text-gray-400">{step === 1 ? '50%' : '100%'}</span>
                </div>
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
                <span className="text-xs text-gray-500">Quick setup</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gray-900">~2 min</span>
                <span className="text-xs text-gray-500">to complete</span>
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
                  <FileText className="w-4 h-4 text-indigo-300" />
                </div>
                <p className="text-xs text-indigo-300">Easy Forms</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
