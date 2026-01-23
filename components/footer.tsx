'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('landing.footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
                alt="EZMig Logo"
                className="h-9 w-auto"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">EZMig</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600 dark:text-neutral-400 max-w-md">
              {t('description')}
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('product')}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/pricing" className="text-sm text-gray-600 dark:text-neutral-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">
                  {t('pricing')}
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-sm text-gray-600 dark:text-neutral-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">
                  {t('features')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('company')}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 dark:text-neutral-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 dark:text-neutral-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">
                  {t('terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-neutral-800">
          <p className="text-sm text-gray-500 dark:text-neutral-500 text-center">
            &copy; {currentYear} {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
