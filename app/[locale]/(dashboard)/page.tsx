'use client';

import { MacbookScroll } from '@/components/ui/macbook-scroll';
import { NoiseBackground } from '@/components/ui/noise-background';
import { Carousel, Card } from '@/components/ui/apple-cards-carousel';
import { AnimatedTestimonials } from '@/components/ui/animated-testimonials';
import { BackgroundRippleEffect } from '@/components/ui/background-ripple-effect';
import { PricingSection } from '@/components/pricing-section';
import { TypewriterEffect } from '@/components/ui/typewriter-effect';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

function CardContent({ title, description }: { title: string; description: string }) {
  return (
    <>
      {[...new Array(3).fill(1)].map((_, index) => {
        return (
          <div
            key={"dummy-content" + index}
            className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4"
          >
            <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
              <span className="font-bold text-neutral-700 dark:text-neutral-200">
                {title}
              </span>{" "}
              {description}
            </p>
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
              alt="Dashboard preview"
              className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain mt-8 rounded-xl"
            />
          </div>
        );
      })}
    </>
  );
}

export default function HomePage() {
  const t = useTranslations('landing');

  const cardContent = (
    <CardContent
      title={t('carousel.contentTitle')}
      description={t('carousel.contentDescription')}
    />
  );

  const data = [
    {
      category: t('carousel.cards.formAutomation.category'),
      title: t('carousel.cards.formAutomation.title'),
      src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=3540&auto=format&fit=crop",
      content: cardContent,
    },
    {
      category: t('carousel.cards.caseManagement.category'),
      title: t('carousel.cards.caseManagement.title'),
      src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=3540&auto=format&fit=crop",
      content: cardContent,
    },
    {
      category: t('carousel.cards.i130.category'),
      title: t('carousel.cards.i130.title'),
      src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=3540&auto=format&fit=crop",
      content: cardContent,
    },
    {
      category: t('carousel.cards.i485.category'),
      title: t('carousel.cards.i485.title'),
      src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=3540&auto=format&fit=crop",
      content: cardContent,
    },
    {
      category: t('carousel.cards.i765.category'),
      title: t('carousel.cards.i765.title'),
      src: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=3540&auto=format&fit=crop",
      content: cardContent,
    },
    {
      category: t('carousel.cards.clientPortal.category'),
      title: t('carousel.cards.clientPortal.title'),
      src: "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=3540&auto=format&fit=crop",
      content: cardContent,
    },
  ];

  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} />
  ));

  return (
    <main className="overflow-hidden bg-white dark:bg-[#0B0B0F]">
      {/* Hero Section */}
      <section className="relative w-full">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <BackgroundRippleEffect />
        </div>
        <div className="relative z-10">
          <MacbookScroll
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80"
            showGradient={false}
            title={
              <span>
                {t('hero.title')} <br />
                <TypewriterEffect
                  words={t.raw('hero.typewriterWords') as string[]}
                  typingSpeed={80}
                  deletingSpeed={40}
                  delayBetweenWords={2500}
                />
              </span>
            }
            cta={
              <NoiseBackground
                containerClassName="w-fit p-2 rounded-full mx-auto"
                gradientColors={[
                  "rgb(167, 139, 250)",
                  "rgb(129, 140, 248)",
                  "rgb(196, 181, 253)",
                ]}
              >
                <button className="h-full w-full cursor-pointer rounded-full bg-gradient-to-r from-neutral-100 via-neutral-100 to-white px-6 py-3 text-black shadow-[0px_2px_0px_0px_var(--color-neutral-50)_inset,0px_0.5px_1px_0px_var(--color-neutral-400)] transition-all duration-100 active:scale-95 dark:from-black dark:via-black dark:to-neutral-900 dark:text-white dark:shadow-[0px_1px_0px_0px_var(--color-neutral-950)_inset,0px_1px_0px_0px_var(--color-neutral-800)] font-medium">
                  {t('hero.cta')} &rarr;
                </button>
              </NoiseBackground>
            }
          />
        </div>
      </section>

      {/* Features Carousel */}
      <section id="features" className="w-full pt-96 pb-10">
        <h2 className="max-w-7xl pl-4 mx-auto text-xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-200 font-sans">
          {t('carousel.title')}
        </h2>
        <Carousel items={cards} />
        <div className="flex justify-center mt-6">
          <Link href="/sign-up">
            <NoiseBackground
              containerClassName="w-fit p-2 rounded-full"
              gradientColors={[
                "rgb(167, 139, 250)",
                "rgb(129, 140, 248)",
                "rgb(196, 181, 253)",
              ]}
            >
              <span className="inline-flex items-center justify-center cursor-pointer rounded-full bg-gradient-to-r from-neutral-100 via-neutral-100 to-white px-6 py-3 text-black shadow-[0px_2px_0px_0px_var(--color-neutral-50)_inset,0px_0.5px_1px_0px_var(--color-neutral-400)] transition-all duration-100 active:scale-95 dark:from-black dark:via-black dark:to-neutral-900 dark:text-white dark:shadow-[0px_1px_0px_0px_var(--color-neutral-950)_inset,0px_1px_0px_0px_var(--color-neutral-800)] font-medium whitespace-nowrap">
                {t('carousel.cta')} &rarr;
              </span>
            </NoiseBackground>
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="w-full pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-200 font-sans text-center mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-center mb-12">
            {t('testimonials.subtitle')}
          </p>
          <AnimatedTestimonials
            testimonials={[
              {
                quote: t('testimonials.items.0.quote'),
                name: t('testimonials.items.0.name'),
                designation: t('testimonials.items.0.designation'),
                src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3540&auto=format&fit=crop",
              },
              {
                quote: t('testimonials.items.1.quote'),
                name: t('testimonials.items.1.name'),
                designation: t('testimonials.items.1.designation'),
                src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3540&auto=format&fit=crop",
              },
              {
                quote: t('testimonials.items.2.quote'),
                name: t('testimonials.items.2.name'),
                designation: t('testimonials.items.2.designation'),
                src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3540&auto=format&fit=crop",
              },
              {
                quote: t('testimonials.items.3.quote'),
                name: t('testimonials.items.3.name'),
                designation: t('testimonials.items.3.designation'),
                src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=3540&auto=format&fit=crop",
              },
            ]}
            autoplay
          />
          <div className="flex justify-center mt-6">
            <Link href="/sign-up">
              <NoiseBackground
                containerClassName="w-fit p-2 rounded-full"
                gradientColors={[
                  "rgb(167, 139, 250)",
                  "rgb(129, 140, 248)",
                  "rgb(196, 181, 253)",
                ]}
              >
                <span className="inline-flex items-center justify-center cursor-pointer rounded-full bg-gradient-to-r from-neutral-100 via-neutral-100 to-white px-6 py-3 text-black shadow-[0px_2px_0px_0px_var(--color-neutral-50)_inset,0px_0.5px_1px_0px_var(--color-neutral-400)] transition-all duration-100 active:scale-95 dark:from-black dark:via-black dark:to-neutral-900 dark:text-white dark:shadow-[0px_1px_0px_0px_var(--color-neutral-950)_inset,0px_1px_0px_0px_var(--color-neutral-800)] font-medium whitespace-nowrap">
                  {t('testimonials.cta')} &rarr;
                </span>
              </NoiseBackground>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />
    </main>
  );
}
