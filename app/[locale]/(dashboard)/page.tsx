'use client';

import { Button } from '@/components/ui/button';
import {
  BentoGrid,
  FeatureCard,
  AnimatedTestimonials
} from '@/components/ui/aceternity';
import {
  ArrowRight,
  FileText,
  Users,
  Upload,
  Search,
  Bot,
  FolderOpen,
  CheckCircle2,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('landing');

  const features = [
    {
      title: t('features.forms.title'),
      description: t('features.forms.description'),
      icon: <FileText className="h-6 w-6" />,
      className: "md:col-span-2",
    },
    {
      title: t('features.clients.title'),
      description: t('features.clients.description'),
      icon: <Users className="h-6 w-6" />,
      className: "md:col-span-1",
    },
    {
      title: t('features.eFiling.title'),
      description: t('features.eFiling.description'),
      icon: <Upload className="h-6 w-6" />,
      className: "md:col-span-1",
    },
    {
      title: t('features.tracker.title'),
      description: t('features.tracker.description'),
      icon: <Search className="h-6 w-6" />,
      className: "md:col-span-1",
    },
    {
      title: t('features.ai.title'),
      description: t('features.ai.description'),
      icon: <Bot className="h-6 w-6" />,
      className: "md:col-span-1",
    },
    {
      title: t('features.evidence.title'),
      description: t('features.evidence.description'),
      icon: <FolderOpen className="h-6 w-6" />,
      className: "md:col-span-2",
    },
  ];

  const testimonials = [
    {
      quote: t('testimonials.items.0.quote'),
      name: t('testimonials.items.0.name'),
      designation: t('testimonials.items.0.designation'),
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=500&fit=crop&crop=face",
    },
    {
      quote: t('testimonials.items.1.quote'),
      name: t('testimonials.items.1.name'),
      designation: t('testimonials.items.1.designation'),
      src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=500&fit=crop&crop=face",
    },
    {
      quote: t('testimonials.items.2.quote'),
      name: t('testimonials.items.2.name'),
      designation: t('testimonials.items.2.designation'),
      src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&h=500&fit=crop&crop=face",
    },
    {
      quote: t('testimonials.items.3.quote'),
      name: t('testimonials.items.3.name'),
      designation: t('testimonials.items.3.designation'),
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&crop=face",
    },
  ];

  const steps = [
    {
      step: "01",
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      icon: <Users className="h-8 w-8" />,
    },
    {
      step: "02",
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      icon: <FileText className="h-8 w-8" />,
    },
    {
      step: "03",
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
      icon: <Upload className="h-8 w-8" />,
    },
  ];

  const stats = [
    { value: t('stats.formsValue'), label: t('stats.forms') },
    { value: t('stats.timeSavedValue'), label: t('stats.timeSaved') },
    { value: t('stats.rfeRateValue'), label: t('stats.rfeRate') },
    { value: t('stats.trialValue'), label: t('stats.trial') },
  ];

  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-teal-700 via-teal-600 to-blue-600">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center justify-center px-4 py-20">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {t('hero.title')}
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-blue-200">
                {t('hero.titleHighlight')}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              {t.rich('hero.subtitle', {
                highlight: (chunks) => <span className="font-semibold text-teal-200">{t('hero.highlight')}</span>
              })}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-10 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="rounded-full bg-white text-teal-700 hover:bg-white/90 font-semibold px-8 py-3 text-lg shadow-lg"
                >
                  {t('hero.cta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 text-white hover:bg-white/10 px-8"
              >
                {t('hero.demo')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Problem */}
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                {t('problem.badge')}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {t('problem.title')}
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{t('problem.item1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{t('problem.item2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Search className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{t('problem.item3')}</span>
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-medium">
                {t('solution.badge')}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {t('solution.title')}
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{t('solution.item1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{t('solution.item2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{t('solution.item3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <BentoGrid className="max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                className={feature.className}
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('howItWorks.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-8 text-center group hover:shadow-lg transition-shadow"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-600 to-blue-600 text-white text-sm font-bold px-4 py-1 rounded-full">
                  {t('howItWorks.step')} {step.step}
                </div>
                <div className="mt-4 mb-6 flex justify-center">
                  <div className="p-4 bg-white rounded-xl shadow-sm text-teal-600 group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-teal-900 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-2">{t('pricing.starter.name')}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{t('pricing.starter.price')}</span>
                <span className="text-white/70"> {t('pricing.starter.credits')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="h-5 w-5 text-teal-400" />
                  <span>{t('pricing.starter.feature1')}</span>
                </li>
                <li className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="h-5 w-5 text-teal-400" />
                  <span>{t('pricing.starter.feature2')}</span>
                </li>
                <li className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="h-5 w-5 text-teal-400" />
                  <span>{t('pricing.starter.feature3')}</span>
                </li>
              </ul>
              <Link href="/sign-up" className="block">
                <Button className="w-full bg-white text-teal-700 hover:bg-white/90">
                  {t('pricing.getStarted')}
                </Button>
              </Link>
            </div>

            {/* Growth - Featured */}
            <div className="bg-white rounded-2xl p-8 shadow-xl relative scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-600 to-blue-600 text-white text-sm font-bold px-4 py-1 rounded-full">
                {t('pricing.growth.badge')}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('pricing.growth.name')}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{t('pricing.growth.price')}</span>
                <span className="text-gray-600"> {t('pricing.growth.credits')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  <span>{t('pricing.growth.feature1')}</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  <span>{t('pricing.growth.feature2')}</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  <span>{t('pricing.growth.feature3')}</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  <span>{t('pricing.growth.feature4')}</span>
                </li>
              </ul>
              <Link href="/sign-up" className="block">
                <Button className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:opacity-90">
                  {t('pricing.getStarted')}
                </Button>
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-2">{t('pricing.enterprise.name')}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{t('pricing.enterprise.price')}</span>
                <span className="text-white/70"> {t('pricing.enterprise.credits')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="h-5 w-5 text-teal-400" />
                  <span>{t('pricing.enterprise.feature1')}</span>
                </li>
                <li className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="h-5 w-5 text-teal-400" />
                  <span>{t('pricing.enterprise.feature2')}</span>
                </li>
                <li className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="h-5 w-5 text-teal-400" />
                  <span>{t('pricing.enterprise.feature3')}</span>
                </li>
                <li className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="h-5 w-5 text-teal-400" />
                  <span>{t('pricing.enterprise.feature4')}</span>
                </li>
              </ul>
              <Link href="/sign-up" className="block">
                <Button className="w-full bg-white text-teal-700 hover:bg-white/90">
                  {t('pricing.contactSales')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('testimonials.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('testimonials.subtitle')}
            </p>
          </div>

          <AnimatedTestimonials testimonials={testimonials} autoplay={true} />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Zap className="h-16 w-16 text-white/80 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="rounded-full bg-white text-teal-700 hover:bg-white/90 font-semibold px-8 py-3 text-lg shadow-lg"
              >
                {t('cta.button')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/30 text-white hover:bg-white/10 px-8"
            >
              {t('cta.demo')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">E</span>
                </div>
                <span className="text-2xl font-bold text-white">EZMig</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                {t('footer.description')}
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footer.product')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.features')}</a></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">{t('footer.pricing')}</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.integrations')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.updates')}</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footer.company')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.about')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.blog')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.careers')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.contact')}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} {t('footer.copyright')}
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{t('footer.privacy')}</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{t('footer.terms')}</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{t('footer.cookies')}</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
