'use client';

import { useActionState, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, ArrowLeft, Eye, EyeOff, X, Mail, KeyRound, RefreshCw } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';
import { Link } from '@/i18n/routing';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale, useTranslations } from 'next-intl';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'code' | 'password' | 'success'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState(['', '', '', '', '', '']);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotPending, setForgotPending] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Handle code input
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...forgotCode];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setForgotCode(newCode);
    } else {
      const newCode = [...forgotCode];
      newCode[index] = value.replace(/\D/g, '');
      setForgotCode(newCode);
    }
  };

  // Reset modal state
  const resetForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep('email');
    setForgotEmail('');
    setForgotCode(['', '', '', '', '', '']);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setResendCooldown(0);
  };

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-[42%] xl:w-[38%] flex flex-col px-4 sm:px-6 lg:px-16 xl:px-20">
        {/* Back to home - Fixed at top */}
        <div className="pt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('backToHome')}
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center py-12">
          <div className="w-full max-w-sm">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 mb-8">
              <img
                src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
                alt="EZMig"
                className="h-9 w-auto"
              />
              <span className="text-xl font-bold text-gray-900">EZMig</span>
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900">
                {mode === 'signin' ? t('welcomeBack') : t('createAccount')}
              </h1>
              <p className="text-gray-500 mt-2">
                {mode === 'signin'
                  ? t('signInSubtitle')
                  : t('signUpSubtitle')}
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" action={formAction}>
              <input type="hidden" name="redirect" value={redirect || ''} />
              <input type="hidden" name="priceId" value={priceId || ''} />
              <input type="hidden" name="inviteId" value={inviteId || ''} />
              <input type="hidden" name="locale" value={locale} />

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  {t('email')}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={state.email}
                  required
                  className="mt-1.5 h-12 rounded-lg border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                  placeholder={t('emailPlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  {t('password')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    defaultValue={state.password}
                    required
                    minLength={8}
                    className="mt-1.5 h-12 rounded-lg border-gray-200 focus:border-gray-900 focus:ring-gray-900 pr-12"
                    placeholder={t('passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {state?.error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {state.error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    {t('loading')}
                  </>
                ) : mode === 'signin' ? (
                  t('signIn')
                ) : (
                  t('signUp')
                )}
              </Button>
            </form>

            {mode === 'signin' && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  {t('forgotPassword')}
                </button>
              </div>
            )}

            {/* Footer link */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    {mode === 'signin'
                      ? t('newToEZMig')
                      : t('alreadyHaveAccount')}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                    redirect ? `?redirect=${redirect}` : ''
                  }${priceId ? `&priceId=${priceId}` : ''}`}
                  className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                  {mode === 'signin'
                    ? t('createAccountLink')
                    : t('signInLink')}
                </Link>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-gray-500">
              {t('termsText')}{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500">{t('termsLink')}</a>
              {' '}{t('andText')}{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500">{t('privacyLink')}</a>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Premium Visual */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[62%] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 items-center justify-center p-16 relative overflow-hidden">
        {/* Language Switcher - Top Right */}
        <div className="absolute top-8 right-8 z-20">
          <LanguageSwitcher theme="dark" />
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 max-w-lg w-full">
          {/* Floating Document Cards */}
          <div className="relative h-80 mb-8">
            {/* Main Document Card */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white rounded-2xl shadow-2xl p-5 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('heroCardMainTitle')}</p>
                  <p className="text-xs text-gray-500">{t('heroCardMainSubtitle')}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full" />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600 font-medium">{t('heroCardStatusReady')}</span>
                  <span className="text-gray-400">100%</span>
                </div>
              </div>
            </div>

            {/* Secondary Card - Left */}
            <div className="absolute -left-4 top-4 w-48 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">{t('heroBadgeCompliant')}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">99.8%</span>
                <span className="text-xs text-gray-500">{t('heroCardAccuracy')}</span>
              </div>
            </div>

            {/* Tertiary Card - Right */}
            <div className="absolute -right-4 bottom-4 w-44 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 transform rotate-6 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">{t('heroActiveCases')}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gray-900">50K+</span>
                <span className="text-xs text-gray-500">{t('heroProcessed')}</span>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('heroTitle')}
            </h2>
            <p className="text-indigo-200 text-lg leading-relaxed mb-8">
              {t('heroSubtitle')}
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">{t('heroStatFormsValue')}</p>
                <p className="text-xs text-indigo-300">{t('heroStatFormsLabel')}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">{t('heroStatTimeSavedValue')}</p>
                <p className="text-xs text-indigo-300">{t('heroStatTimeSavedLabel')}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">{t('heroStatComplianceValue')}</p>
                <p className="text-xs text-indigo-300">{t('heroStatComplianceLabel')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={resetForgotModal}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
            {/* Close button */}
            <button
              type="button"
              onClick={resetForgotModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Step 1: Email */}
            {forgotStep === 'email' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('forgotPasswordTitle')}
                  </h2>
                  <p className="text-gray-500 mt-2 text-sm">
                    {t('forgotPasswordSubtitle')}
                  </p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); setForgotStep('code'); setResendCooldown(30); }}>
                  <div className="mb-4">
                    <Label htmlFor="forgotEmail" className="text-sm font-medium text-gray-700">
                      {t('email')}
                    </Label>
                    <Input
                      id="forgotEmail"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="mt-1.5 h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder={t('emailPlaceholder')}
                      autoFocus
                    />
                  </div>

                  {forgotError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                      {forgotError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                    disabled={forgotPending}
                  >
                    {forgotPending ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        {t('sendingCode')}
                      </>
                    ) : (
                      t('sendVerificationCode')
                    )}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                  {t('rememberPassword')}{' '}
                  <button
                    type="button"
                    onClick={resetForgotModal}
                    className="font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {t('backToSignIn')}
                  </button>
                </p>
              </>
            )}

            {/* Step 2: Enter Code */}
            {forgotStep === 'code' && (
              <>
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setForgotStep('email')}
                  className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('checkYourEmail')}
                  </h2>
                  <p className="text-gray-500 mt-2 text-sm">
                    {t('codeSentTo')}<br />
                    <span className="font-medium text-gray-900">{forgotEmail}</span>
                  </p>
                </div>

                <div className="mb-4">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    {t('verificationCode')}
                  </Label>
                  <div className="flex gap-2 justify-between">
                    {forgotCode.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        className="w-12 h-14 text-center text-xl font-semibold border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-gray-500">{t('didntReceiveCode')}</span>
                    <button
                      type="button"
                      onClick={() => setResendCooldown(30)}
                      disabled={resendCooldown > 0 || forgotPending}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {resendCooldown > 0 ? `${t('resendIn')} ${resendCooldown}s` : t('resendCode')}
                    </button>
                  </div>
                </div>

                {forgotError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {forgotError}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={() => setForgotStep('password')}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  {t('continue')}
                </Button>
              </>
            )}

            {/* Step 3: New Password */}
            {forgotStep === 'password' && (
              <>
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setForgotStep('code')}
                  className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('setNewPassword')}
                  </h2>
                  <p className="text-gray-500 mt-2 text-sm">
                    {t('createStrongPassword')}
                  </p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); setForgotStep('success'); }}>
                  <div className="mb-4">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                      {t('newPassword')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showForgotPassword ? 'text' : 'password'}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="mt-1.5 h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 pr-12"
                        placeholder={t('minCharacters')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(!showForgotPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 hover:text-gray-600"
                      >
                        {showForgotPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="confirmNewPassword" className="text-sm font-medium text-gray-700">
                      {t('confirmPassword')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmNewPassword"
                        type={showForgotConfirmPassword ? 'text' : 'password'}
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="mt-1.5 h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 pr-12"
                        placeholder={t('confirmYourPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 hover:text-gray-600"
                      >
                        {showForgotConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {forgotError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                      {forgotError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                    disabled={forgotPending}
                  >
                    {forgotPending ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        {t('resettingPassword')}
                      </>
                    ) : (
                      t('resetPassword')
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* Step 4: Success */}
            {forgotStep === 'success' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('passwordResetSuccess')}
                </h2>
                <p className="text-gray-500 mb-6">
                  {t('passwordResetSuccessMessage')}
                </p>
                <Button
                  type="button"
                  onClick={resetForgotModal}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  {t('backToSignIn')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
