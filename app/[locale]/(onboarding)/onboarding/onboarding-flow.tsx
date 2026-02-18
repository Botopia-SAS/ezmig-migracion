'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FreelancerForm } from '@/components/freelancers/freelancer-form';
import { AgencyRegistrationForm } from '@/components/agencies';
import {
  ArrowLeft,
  Building2,
  User,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/language-switcher';
import type {
  FreelancerRegistrationData,
  AgencyRegistrationData
} from '@/lib/db/schema';

interface OnboardingFlowProps {
  userId: string;
  userEmail: string;
  locale: string;
}

type OnboardingStep = 'select-type' | 'agency-form' | 'freelancer-form';
type ProfileType = 'agency' | 'freelancer';

const PROFILE_OPTIONS: { id: ProfileType; icon: typeof Building2; recommended?: boolean }[] = [
  {
    id: 'agency',
    icon: Building2,
    recommended: true
  },
  {
    id: 'freelancer',
    icon: User,
  }
];

export function OnboardingFlow({ userId, userEmail, locale }: OnboardingFlowProps) {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('select-type');
  const [selectedProfileType, setSelectedProfileType] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileTypeSelect = (profileType: ProfileType) => {
    setSelectedProfileType(profileType);
    setTimeout(() => {
      if (profileType === 'agency') {
        setCurrentStep('agency-form');
      } else if (profileType === 'freelancer') {
        setCurrentStep('freelancer-form');
      }
    }, 300);
  };

  const handleBack = () => {
    setCurrentStep('select-type');
    setSelectedProfileType(null);
  };

  const handleAgencySave = async (data: Partial<AgencyRegistrationData>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/onboarding/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          agencyData: data
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error creating agency profile');
      }

      toast.success(t('toasts.profileCreated'));
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving agency:', error);
      toast.error(error instanceof Error ? error.message : t('toasts.profileError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreelancerSave = async (data: FreelancerRegistrationData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/onboarding/freelancer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          freelancerData: data
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error creating freelancer profile');
      }

      toast.success(t('toasts.profileCreated'));
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving freelancer:', error);
      toast.error(error instanceof Error ? error.message : t('toasts.profileError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left side - Form (scrollable) */}
      <div className="w-full lg:w-[42%] xl:w-[38%] flex flex-col px-4 sm:px-6 lg:px-16 xl:px-20 overflow-y-auto">
        {/* Back navigation */}
        <div className="pt-8 flex justify-between items-center">
          <div>
            {currentStep !== 'select-type' ? (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('back')}
              </button>
            ) : (
              <div></div>
            )}
          </div>

          {/* Skip button - always visible */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            {t('skipSetup')}
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center py-12">
          <div className="w-full max-w-md mx-auto">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 mb-8">
              <img
                src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
                alt="EZMig"
                className="h-9 w-auto"
              />
              <span className="text-xl font-bold text-gray-900">EZMig</span>
            </Link>

            {/* Step indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      currentStep === 'select-type'
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    )}
                  >
                    1
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
                </div>
                <div className="flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      currentStep !== 'select-type'
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    )}
                  >
                    2
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">{t('step1')}</span>
                <span className="text-xs text-gray-500">{t('step2')}</span>
              </div>
            </div>

            {/* Profile type selection */}
            {currentStep === 'select-type' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {t('welcome')}
                  </h1>
                  <p className="text-gray-500 mt-2">
                    {t('howWillYouUse')}
                  </p>
                </div>

                <div className="space-y-3">
                  {PROFILE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleProfileTypeSelect(option.id)}
                      className={cn(
                        "w-full p-4 rounded-lg border-2 text-left transition-all group",
                        "hover:border-indigo-600 hover:bg-gray-50",
                        selectedProfileType === option.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 bg-white"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              selectedProfileType === option.id
                                ? "bg-indigo-100 text-indigo-600"
                                : "bg-gray-100 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                            )}
                          >
                            <option.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">
                                {t(`profileTypes.${option.id}.title`)}
                              </h3>
                              {option.recommended && (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                  {t('recommended')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {t(`profileTypes.${option.id}.subtitle`)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-5 w-5 transition-transform",
                            selectedProfileType === option.id
                              ? "text-indigo-600 translate-x-1"
                              : "text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1"
                          )}
                        />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {selectedProfileType && (
                    <Button
                      onClick={() => handleProfileTypeSelect(selectedProfileType)}
                      className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                    >
                      {t('continue')}
                    </Button>
                  )}

                  {/* Prominent Skip Button */}
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      className="w-full h-12 border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg font-medium"
                    >
                      {t('skipSetup')} →
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Agency form */}
            {currentStep === 'agency-form' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {t('agencyForm.title')}
                  </h1>
                  <p className="text-gray-500 mt-2">
                    {t('agencyForm.subtitle')}
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 Puedes completar estos datos más tarde desde tu dashboard.
                    </p>
                  </div>
                </div>

                <AgencyRegistrationForm
                  initialData={{ email: userEmail }}
                  onSave={handleAgencySave}
                  isLoading={isLoading}
                  compact
                />

                {/* Skip option for agency form */}
                <div className="pt-4 border-t border-gray-200">
                  <Link href="/dashboard">
                    <Button
                      variant="ghost"
                      className="w-full text-gray-500 hover:text-gray-700"
                    >
                      {t('skipSetup')} - Completar más tarde
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Freelancer form */}
            {currentStep === 'freelancer-form' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {t('freelancerForm.title')}
                  </h1>
                  <p className="text-gray-500 mt-2">
                    {t('freelancerForm.subtitle')}
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 Puedes completar estos datos más tarde desde tu dashboard.
                    </p>
                  </div>
                </div>

                <FreelancerForm
                  initialData={{ email: userEmail }}
                  onSave={handleFreelancerSave}
                  onCancel={handleBack}
                  isLoading={isLoading}
                  showDisclaimerValidation={true}
                />

                {/* Skip option for freelancer form */}
                <div className="pt-4 border-t border-gray-200">
                  <Link href="/dashboard">
                    <Button
                      variant="ghost"
                      className="w-full text-gray-500 hover:text-gray-700"
                    >
                      {t('skipSetup')} - Completar más tarde
                    </Button>
                  </Link>
                </div>
              </div>
            )}
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
                  <p className="text-sm font-semibold text-gray-900">{t('rightPanel.formName')}</p>
                  <p className="text-xs text-gray-500">{t('rightPanel.formSubtitle')}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full" />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600 font-medium">{t('rightPanel.readyToSubmit')}</span>
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
                <span className="text-xs font-medium text-gray-700">{t('rightPanel.uscisCompliant')}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">99.8%</span>
                <span className="text-xs text-gray-500">{t('rightPanel.accuracy')}</span>
              </div>
            </div>

            {/* Tertiary Card - Right */}
            <div className="absolute -right-4 bottom-4 w-44 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 transform rotate-6 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">{t('rightPanel.activeCases')}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gray-900">50K+</span>
                <span className="text-xs text-gray-500">{t('rightPanel.processed')}</span>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('rightPanel.headline')}
            </h2>
            <p className="text-indigo-200 text-lg leading-relaxed mb-8">
              {t('rightPanel.description')}
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">100+</p>
                <p className="text-xs text-indigo-300">{t('rightPanel.forms')}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">80%</p>
                <p className="text-xs text-indigo-300">{t('rightPanel.timeSaved')}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-indigo-300">{t('rightPanel.compliance')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
