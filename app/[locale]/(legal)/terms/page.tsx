import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('legal.terms');
  return {
    title: t('title') + ' | EZMig',
  };
}

export default function TermsPage() {
  const t = useTranslations('legal.terms');

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('title')}</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">{t('lastUpdated')}</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.acceptance.title')}</h2>
          <p className="text-gray-600">{t('sections.acceptance.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.services.title')}</h2>
          <p className="text-gray-600">{t('sections.services.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.accounts.title')}</h2>
          <p className="text-gray-600">{t('sections.accounts.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.payment.title')}</h2>
          <p className="text-gray-600">{t('sections.payment.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.intellectual.title')}</h2>
          <p className="text-gray-600">{t('sections.intellectual.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.limitation.title')}</h2>
          <p className="text-gray-600">{t('sections.limitation.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.changes.title')}</h2>
          <p className="text-gray-600">{t('sections.changes.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.contact.title')}</h2>
          <p className="text-gray-600">{t('sections.contact.content')}</p>
        </section>
      </div>
    </div>
  );
}
