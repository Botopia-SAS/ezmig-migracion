'use client';

import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Home, LogOut, HelpCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/[locale]/(login)/actions';
import { useRouter, Link } from '@/i18n/routing';
import { User, TeamDataWithMembers } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const t = useTranslations('header');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const { data: team } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Button asChild variant="ghost" className="text-sm sm:text-base font-medium text-black">
          <Link href="/sign-in">{t('logIn')}</Link>
        </Button>
        <Button asChild className="rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-semibold text-sm sm:text-base px-4 sm:px-5">
          <Link href="/sign-up">{t('getStarted')} →</Link>
        </Button>
      </>
    );
  }

  return (
    <div className="flex items-center bg-white rounded-full p-1 pl-4 pr-1 shadow-sm border border-gray-200">
      <Link href="/dashboard" className="text-sm font-semibold text-gray-700 mr-2 hover:text-violet-600 transition-colors">
        {t('dashboard')}
      </Link>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger className="outline-none">
          <Avatar className="cursor-pointer size-8 hover:opacity-80 transition-opacity">
            <AvatarImage src={team?.logoUrl || undefined} alt={user.name || ''} />
            <AvatarFallback className="text-xs font-bold bg-violet-100 text-violet-700">
              {user.email
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="flex flex-col gap-1">
          <DropdownMenuItem className="cursor-pointer">
            <Link href="/dashboard" className="flex w-full items-center">
              <Home className="mr-2 h-4 w-4" />
              <span>{t('dashboard')}</span>
            </Link>
          </DropdownMenuItem>
          <form action={handleSignOut} className="w-full">
            <button type="submit" className="flex w-full">
              <DropdownMenuItem className="w-full flex-1 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('signOut')}</span>
              </DropdownMenuItem>
            </button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Header() {
  const t = useTranslations('header');
  const { data: user } = useSWR<User>('/api/user', fetcher);

  const navLinks = [
    { href: '/#features', label: t('features') },
    { href: '/#testimonials', label: t('testimonials') },
    { href: '/pricing', label: t('pricing') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/30 backdrop-blur-sm border-none dark:bg-neutral-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo + Navigation */}
        <div className="flex items-center gap-4 md:gap-8">
          {user ? (
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="rounded-full border-gray-200 bg-white hover:bg-gray-50 text-black font-medium text-sm">
                <Link href="/dashboard">{t('goToDashboard')}</Link>
              </Button>
              <Link href="/" className="shrink-0 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <img
                  src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
                  alt="EZMig Logo"
                  className="h-6 sm:h-8 w-auto"
                />
              </Link>
            </div>
          ) : (
            <Link href="/" className="shrink-0">
              <img
                src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
                alt="EZMig Logo"
                className="h-8 sm:h-12 w-auto"
              />
            </Link>
          )}

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base font-medium text-black hover:text-violet-500 dark:text-white dark:hover:text-violet-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/#faq"
              className="flex items-center gap-1 text-base font-medium text-black hover:text-violet-500 dark:text-white dark:hover:text-violet-400 transition-colors"
            >
              {t('faq')}
              <HelpCircle className="h-4 w-4" />
            </a>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
