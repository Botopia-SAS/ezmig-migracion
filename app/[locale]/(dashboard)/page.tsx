'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { AnimationContainer } from '@/components/ui/animation-container';
import { MagicBadge } from '@/components/ui/magic-badge';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

// Lazy load heavy components that use framer-motion
const BorderBeam = dynamic(() => import('@/components/ui/border-beam').then(m => ({ default: m.BorderBeam })), { ssr: false });
const BentoGrid = dynamic(() => import('@/components/ui/bento-grid').then(m => ({ default: m.BentoGrid })), { ssr: false });
const BentoCard = dynamic(() => import('@/components/ui/bento-grid').then(m => ({ default: m.BentoCard })), { ssr: false });
const Timeline = dynamic(() => import('@/components/ui/timeline').then(m => ({ default: m.Timeline })), { ssr: false });
const WorldMap = dynamic(() => import('@/components/ui/world-map'), { ssr: false });

import {
  FileText,
  Users,
  Shield,
  CheckCircle,
  Zap,
  ArrowRight,
  Upload,
  Eye,
  Edit3,
  Download,
  Sparkles,
  ChevronDown,
  HelpCircle,
  Globe,
  FileCheck,
  Award,
} from 'lucide-react';

// FAQ Accordion Item Component
function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AnimationContainer delay={0.1 + index * 0.05}>
      <div
        className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
          isOpen ? 'border-indigo-200 shadow-lg shadow-indigo-100/50' : 'border-gray-200 hover:border-indigo-100'
        }`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
        >
          <span className="font-medium text-gray-900 pr-4">{question}</span>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isOpen ? 'bg-indigo-100 rotate-180' : 'bg-gray-100'
          }`}>
            <ChevronDown className={`w-5 h-5 transition-colors ${isOpen ? 'text-indigo-600' : 'text-gray-500'}`} />
          </div>
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-6 pb-5 text-gray-600 leading-relaxed">
            {answer}
          </div>
        </div>
      </div>
    </AnimationContainer>
  );
}

export default function HomePage() {
  const t = useTranslations('landing');
  const [isYearly, setIsYearly] = useState(true);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden scrollbar-hide relative">
      {/* Grid Pattern Background - Base */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Hero Section */}
      <section className="pt-28 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <AnimationContainer className="order-1 lg:order-1 flex flex-col items-start text-left">
              <button className="group relative grid overflow-hidden rounded-full px-4 py-1 shadow-[0_1000px_0_0_hsl(0_0%_85%)_inset] transition-colors duration-200 mb-6">
                <span>
                  <span className="spark mask-gradient absolute inset-0 h-[100%] w-[100%] animate-flip overflow-hidden rounded-full [mask:linear-gradient(white,_transparent_50%)] before:absolute before:aspect-square before:w-[200%] before:rotate-[-90deg] before:animate-rotate before:bg-[conic-gradient(from_0deg,transparent_0_340deg,#6366f1_360deg)] before:content-[''] before:[inset:0_auto_auto_50%] before:[translate:-50%_-15%]" />
                </span>
                <span className="backdrop absolute inset-[1px] rounded-full bg-white transition-colors duration-200 group-hover:bg-gray-50" />
                <span className="h-full w-full blur-md absolute bottom-0 inset-x-0 bg-gradient-to-tr from-indigo-500/10"></span>
                <span className="z-10 py-0.5 text-sm text-gray-700 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  {t('hero.badge')}
                  <ArrowRight className="ml-1 w-3 h-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                </span>
              </button>

              <h1 className="text-gray-900 text-left py-4 text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold tracking-tight !leading-[1.1]">
                {t('hero.title')}{' '}
                <span className="text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text">
                  {t('hero.titleHighlight')}
                </span>
              </h1>

              <p className="mb-8 text-lg tracking-tight text-gray-600 md:text-xl max-w-xl">
                {t('hero.subtitle', { highlight: t('hero.highlight') })}
                <br className="hidden md:block" />
                <span className="hidden md:block mt-2">
                  {t('hero.subtitleLine2')}
                </span>
              </p>

              <div className="flex items-center whitespace-nowrap gap-4">
                <Link href="/sign-up">
                  <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-8 h-12">
                    {t('hero.cta')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-12 border-gray-200 bg-white">
                    {t('hero.demo')}
                  </Button>
                </Link>
              </div>
            </AnimationContainer>

            {/* Right side - Image/Mockup */}
            <AnimationContainer delay={0.1} className="order-2 lg:order-2">
              <div className="relative">
                <div className="absolute -top-10 -left-10 w-3/4 h-3/4 blur-[5rem] animate-image-glow opacity-50 bg-gradient-to-br from-indigo-400 via-blue-400 to-indigo-500"></div>
                <div className="relative rounded-xl p-2 ring-1 ring-inset ring-indigo-200 lg:rounded-2xl bg-white/80 backdrop-blur-sm">
                  <BorderBeam size={250} duration={12} delay={9} colorFrom="#6366f1" colorTo="#3b82f6" borderWidth={2} />
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-xs text-gray-400">EZMig - Immigration Case Workspace</span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 divide-x divide-gray-100">
                      <div className="p-8 bg-gray-50/50">
                        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-5">Client Information</div>
                        <div className="space-y-4">
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-4/5 mt-5"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </div>
                      <div className="p-8">
                        <div className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-5">USCIS Form Preview</div>
                        <div className="space-y-4">
                          <div className="h-3 bg-indigo-100 rounded w-3/4"></div>
                          <div className="h-3 bg-indigo-100 rounded w-full"></div>
                          <div className="h-3 bg-indigo-100 rounded w-5/6"></div>
                          <div className="h-3 bg-indigo-100 rounded w-2/3"></div>
                          <div className="h-3 bg-indigo-100 rounded w-4/5 mt-5"></div>
                          <div className="h-3 bg-indigo-100 rounded w-full"></div>
                          <div className="h-3 bg-indigo-100 rounded w-3/4"></div>
                          <div className="h-3 bg-indigo-100 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimationContainer>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-8 px-4">
        <AnimationContainer delay={0.3}>
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">
              {t('trust.title')}
            </p>
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{t('trust.uscis')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{t('trust.aila')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{t('trust.soc2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{t('trust.hipaa')}</span>
              </div>
            </div>
          </div>
        </AnimationContainer>
      </section>

      {/* Features Section - Bento Grid */}
      <section id="features" className="py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimationContainer delay={0.1}>
            <div className="flex flex-col w-full items-center justify-center py-2">
              <MagicBadge title={t('features.badge')} />
              <h2 className="text-center text-2xl md:text-4xl !leading-[1.1] font-bold text-gray-900 mt-4">
                {t('features.title')}
              </h2>
              <p className="mt-3 text-center text-base text-gray-600 max-w-lg">
                {t('features.subtitle')}
              </p>
            </div>
          </AnimationContainer>

          <AnimationContainer delay={0.2}>
            <BentoGrid className="py-2">
              {/* Smart Forms Card */}
              <BentoCard
                name={t('features.forms.title')}
                className="col-span-3 lg:col-span-1"
                background={
                  <div className="absolute top-10 left-10 origin-top rounded-md transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_0%,#000_100%)] group-hover:scale-105 border border-gray-200 bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm font-medium text-gray-900 mb-2">{t('features.searchForms')}</div>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                      <span className="text-xs text-gray-400">Drop files here</span>
                    </div>
                  </div>
                }
                Icon={FileText}
                description={t('features.forms.description')}
                href="#"
                cta={t('features.learnMore')}
              />

              {/* Case Management Card */}
              <BentoCard
                name={t('features.clients.title')}
                className="col-span-3 lg:col-span-2"
                background={
                  <div className="absolute right-10 top-10 w-[70%] border border-gray-200 transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:-translate-x-10 p-4 rounded-lg bg-white shadow-sm">
                    <Input placeholder={t('features.searchForms')} className="mb-3" />
                    <div className="cursor-pointer text-sm">
                      <div className="px-4 py-2 hover:bg-gray-50 rounded flex justify-between">
                        <span className="text-gray-600">{t('features.i130')}</span>
                        <span className="text-indigo-600">Active</span>
                      </div>
                      <div className="px-4 py-2 hover:bg-gray-50 rounded flex justify-between">
                        <span className="text-gray-600">{t('features.i485')}</span>
                        <span className="text-indigo-600">Pending</span>
                      </div>
                      <div className="px-4 py-2 hover:bg-gray-50 rounded flex justify-between">
                        <span className="text-gray-600">{t('features.i765')}</span>
                        <span className="text-indigo-600">Approved</span>
                      </div>
                      <div className="px-4 py-2 hover:bg-gray-50 rounded flex justify-between">
                        <span className="text-gray-600">{t('features.i589')}</span>
                        <span className="text-indigo-600">Draft</span>
                      </div>
                      <div className="px-4 py-2 hover:bg-gray-50 rounded flex justify-between">
                        <span className="text-gray-600">{t('features.i539')}</span>
                        <span className="text-indigo-600">Review</span>
                      </div>
                    </div>
                  </div>
                }
                Icon={Users}
                description={t('features.clients.description')}
                href="#"
                cta={t('features.learnMore')}
              />

              {/* Team Workspace Card */}
              <BentoCard
                name={t('features.ai.title')}
                className="col-span-3 lg:col-span-2"
                background={
                  <div className="absolute right-2 pl-28 md:pl-0 top-4 h-[300px] w-[600px] transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105">
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Connection lines */}
                      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                        <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="#e5e7eb" strokeWidth="2" />
                        <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="#e5e7eb" strokeWidth="2" />
                        <line x1="50%" y1="50%" x2="20%" y2="60%" stroke="#e5e7eb" strokeWidth="2" />
                        <line x1="50%" y1="50%" x2="80%" y2="60%" stroke="#e5e7eb" strokeWidth="2" />
                        <line x1="50%" y1="50%" x2="50%" y2="20%" stroke="#e5e7eb" strokeWidth="2" />
                        <line x1="25%" y1="25%" x2="50%" y2="20%" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                        <line x1="75%" y1="25%" x2="50%" y2="20%" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                      </svg>
                      {/* Central hub */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-indigo-300 z-10">
                        <Globe className="w-8 h-8 text-indigo-600" />
                      </div>
                      {/* Connected users */}
                      <div className="absolute left-[25%] top-[25%] -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="absolute left-[75%] top-[25%] -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center border border-green-200">
                        <FileCheck className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="absolute left-[20%] top-[60%] -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center border border-orange-200">
                        <Edit3 className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="absolute left-[80%] top-[60%] -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center border border-pink-200">
                        <Shield className="w-6 h-6 text-pink-600" />
                      </div>
                      <div className="absolute left-[50%] top-[20%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center border border-indigo-200">
                        <Zap className="w-5 h-5 text-indigo-600" />
                      </div>
                    </div>
                  </div>
                }
                Icon={Zap}
                description={t('features.ai.description')}
                href="#"
                cta={t('features.learnMore')}
              />

              {/* Case Tracker Card */}
              <BentoCard
                name={t('features.tracker.title')}
                className="col-span-3 lg:col-span-1"
                background={
                  <div className="absolute right-0 top-10 origin-top rounded-md border border-gray-200 transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105 bg-white p-4 shadow-sm">
                    <div className="w-44 bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="w-5 h-5 text-indigo-600" />
                        <span className="text-xs font-semibold text-gray-700">Case Status</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">USCIS Tracking</span>
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                      </div>
                    </div>
                  </div>
                }
                Icon={Shield}
                description={t('features.tracker.description')}
                href="#"
                cta={t('features.learnMore')}
              />
            </BentoGrid>
          </AnimationContainer>
        </div>
      </section>

      {/* Process Section - Timeline Style */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimationContainer delay={0.1}>
            <div className="flex flex-col items-center justify-center w-full py-4 max-w-xl mx-auto mb-10">
              <MagicBadge title={t('howItWorks.badge')} />
              <h2 className="text-center text-3xl md:text-5xl !leading-[1.1] font-bold text-gray-900 mt-6">
                {t('howItWorks.title')}
              </h2>
              <p className="mt-4 text-center text-lg text-gray-600 max-w-lg">
                {t('howItWorks.subtitle')}
              </p>
            </div>
          </AnimationContainer>

          <div className="relative w-full overflow-clip">
            <Timeline data={[
              {
                title: t('howItWorks.step1.title'),
                content: (
                  <div>
                    <p className="text-gray-600 text-sm md:text-base mb-6">
                      {t('howItWorks.step1.description')}
                    </p>
                    {/* Video placeholder */}
                    <div className="aspect-video bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl overflow-hidden relative shadow-2xl">
                      {/* Fallback */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Upload className="w-20 h-20 text-white/40" />
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                title: t('howItWorks.step2.title'),
                content: (
                  <div>
                    <p className="text-gray-600 text-sm md:text-base mb-6">
                      {t('howItWorks.step2.description')}
                    </p>
                    {/* Video placeholder */}
                    <div className="aspect-video bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl overflow-hidden relative shadow-2xl">
                      {/* Fallback */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Eye className="w-20 h-20 text-white/40" />
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                title: t('howItWorks.step3.title'),
                content: (
                  <div>
                    <p className="text-gray-600 text-sm md:text-base mb-6">
                      {t('howItWorks.step3.description')}
                    </p>
                    {/* Video placeholder */}
                    <div className="aspect-video bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl overflow-hidden relative shadow-2xl">
                      {/* Fallback */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Edit3 className="w-20 h-20 text-white/40" />
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                title: t('howItWorks.step4.title'),
                content: (
                  <div>
                    <p className="text-gray-600 text-sm md:text-base mb-6">
                      {t('howItWorks.step4.description')}
                    </p>
                    {/* Video placeholder */}
                    <div className="aspect-video bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl overflow-hidden relative shadow-2xl">
                      {/* Fallback */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Download className="w-20 h-20 text-white/40" />
                      </div>
                    </div>
                  </div>
                ),
              },
            ]} />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-6 px-4 bg-gradient-to-b from-white via-indigo-50/50 to-white">
        <div className="max-w-6xl mx-auto">
          <AnimationContainer delay={0.1}>
            <div className="flex flex-col items-center justify-center w-full py-2 max-w-xl mx-auto">
              <MagicBadge title={t('pricing.title')} />
              <h2 className="text-center text-3xl md:text-5xl !leading-[1.1] font-bold text-gray-900 mt-6">
                {t('pricing.title')}
              </h2>
              <p className="mt-4 text-center text-lg text-gray-600 max-w-lg">
                {t('pricing.subtitle')}
              </p>

              {/* Monthly/Yearly Toggle */}
              <div className="flex items-center gap-1 mt-8 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
                    !isYearly
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
                    isYearly
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </AnimationContainer>

          <AnimationContainer delay={0.2}>
            <div className="grid md:grid-cols-3 gap-6 py-4">
              {/* Starter Plan */}
              <div className="relative rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:border-gray-300 flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{t('pricing.starter.name')}</h3>
                  <p className="text-sm text-gray-500 mt-1">For solo practitioners</p>
                </div>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-bold text-gray-900">{t('pricing.starter.price')}</span>
                  <span className="text-gray-500 text-lg">{t('pricing.starter.credits')}</span>
                </div>
                <ul className="space-y-4 text-sm text-gray-600 flex-1">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {t('pricing.starter.feature1')}
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {t('pricing.starter.feature2')}
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {t('pricing.starter.feature3')}
                  </li>
                </ul>
                <Link href="/sign-up" className="mt-8">
                  <Button variant="outline" className="w-full h-11 rounded-lg border-gray-200">
                    {t('pricing.getStarted')}
                  </Button>
                </Link>
              </div>

              {/* Growth Plan */}
              <div className="relative rounded-2xl border-2 border-indigo-500 bg-white p-6 transition-all hover:shadow-xl flex flex-col h-full">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    {t('pricing.growth.badge')}
                  </span>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{t('pricing.growth.name')}</h3>
                  <p className="text-sm text-gray-500 mt-1">For growing practices</p>
                </div>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-bold text-gray-900">{t('pricing.growth.price')}</span>
                  <span className="text-gray-500 text-lg">{t('pricing.growth.credits')}</span>
                  {isYearly && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">
                      -20%
                    </span>
                  )}
                </div>
                <ul className="space-y-4 text-sm text-gray-600 flex-1">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {t('pricing.growth.feature1')}
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {t('pricing.growth.feature2')}
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {t('pricing.growth.feature3')}
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {t('pricing.growth.feature4')}
                  </li>
                </ul>
                <Link href="/sign-up" className="mt-8">
                  <Button className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                    {t('pricing.getStarted')}
                  </Button>
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="relative rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:border-gray-300 flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{t('pricing.enterprise.name')}</h3>
                  <p className="text-sm text-gray-500 mt-1">For law firms</p>
                </div>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-bold text-gray-900">{t('pricing.enterprise.price')}</span>
                  <span className="text-gray-500 text-lg">{t('pricing.enterprise.credits')}</span>
                </div>
                <ul className="space-y-4 text-sm text-gray-600 flex-1">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {t('pricing.enterprise.feature1')}
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {t('pricing.enterprise.feature2')}
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {t('pricing.enterprise.feature3')}
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {t('pricing.enterprise.feature4')}
                  </li>
                </ul>
                <Link href="/sign-up" className="mt-8">
                  <Button variant="outline" className="w-full h-11 rounded-lg border-gray-200">
                    {t('pricing.contactSales')}
                  </Button>
                </Link>
              </div>
            </div>
          </AnimationContainer>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimationContainer delay={0.1}>
            <div className="flex flex-col items-center justify-center w-full mb-8">
              <MagicBadge title={t('faq.badge')} />
            </div>
          </AnimationContainer>

          <AnimationContainer delay={0.2}>
            <div className="max-w-4xl mx-auto space-y-4">
              {(t.raw('faq.items') as Array<{question: string; answer: string}>).map((faq, index) => (
                <FaqItem key={index} question={faq.question} answer={faq.answer} index={index} />
              ))}
            </div>
          </AnimationContainer>

          <AnimationContainer delay={0.3}>
            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">{t('faq.stillQuestions')}</p>
              <Link href="mailto:support@ezmig.io">
                <Button variant="outline" className="rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  {t('faq.contactSupport')}
                </Button>
              </Link>
            </div>
          </AnimationContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700" />

        {/* World Map Background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[90%] md:w-[80%] max-w-5xl h-full">
            <WorldMap
              lineColor="#a5b4fc"
              darkMode={true}
              dots={[
                {
                  start: { lat: 40.7128, lng: -74.006 }, // New York
                  end: { lat: 51.5074, lng: -0.1278 }, // London
                },
                {
                  start: { lat: 51.5074, lng: -0.1278 }, // London
                  end: { lat: 48.8566, lng: 2.3522 }, // Paris
                },
                {
                  start: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
                  end: { lat: 19.4326, lng: -99.1332 }, // Mexico City
                },
                {
                  start: { lat: 19.4326, lng: -99.1332 }, // Mexico City
                  end: { lat: -23.5505, lng: -46.6333 }, // Sao Paulo
                },
                {
                  start: { lat: 48.8566, lng: 2.3522 }, // Paris
                  end: { lat: 55.7558, lng: 37.6173 }, // Moscow
                },
                {
                  start: { lat: 55.7558, lng: 37.6173 }, // Moscow
                  end: { lat: 35.6762, lng: 139.6503 }, // Tokyo
                },
              ]}
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-4">
            <AnimationContainer delay={0.1}>
              <div className="flex flex-col items-center justify-center text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  {t('cta.title')}{" "}
                  <span className="text-indigo-200">{t('cta.titleHighlight')}</span>
                </h2>
                <p className="text-indigo-100 max-w-md mx-auto text-lg mb-6">
                  {t('cta.subtitle')}
                </p>
                <Link href="/sign-up">
                  <Button size="lg" className="bg-white hover:bg-gray-100 text-indigo-700 rounded-full px-8 h-12 font-semibold shadow-lg">
                    {t('cta.button')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </AnimationContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
