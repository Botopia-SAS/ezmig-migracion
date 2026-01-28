import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('legal.privacy');
  return {
    title: t('title') + ' | EZMig',
  };
}

export default function PrivacyPage() {
  const t = useTranslations('legal.privacy');

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('title')}</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">{t('lastUpdated')}</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.collection.title')}</h2>
          <p className="text-gray-600">{t('sections.collection.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.use.title')}</h2>
          <p className="text-gray-600">{t('sections.use.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.sharing.title')}</h2>
          <p className="text-gray-600">{t('sections.sharing.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.security.title')}</h2>
          <p className="text-gray-600">{t('sections.security.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.cookies.title')}</h2>
          <p className="text-gray-600">{t('sections.cookies.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.rights.title')}</h2>
          <p className="text-gray-600">{t('sections.rights.content')}</p>
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
