'use client';

import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/[locale]/(login)/actions';
import { useRouter, Link } from '@/i18n/routing';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Footer } from '@/components/footer';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const t = useTranslations('header');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
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
          <Link href="/sign-in">{t('signIn')}</Link>
        </Button>
        <Button asChild className="rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base px-3 sm:px-4">
          <Link href="/sign-up">{t('signUp')}</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
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
  );
}

function Header() {
  const t = useTranslations('header');

  const navLinks = [
    { href: '/#features', label: t('features') },
    { href: '/#testimonials', label: t('testimonials') },
    { href: '/#pricing', label: t('pricing') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md dark:bg-neutral-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo + Navigation */}
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex items-center gap-1 sm:gap-2 shrink-0">
            <img
              src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
              alt="EZMig Logo"
              className="h-8 sm:h-12 w-auto"
            />
            <span className="hidden sm:inline text-2xl font-bold text-gray-900 dark:text-white">EZMig</span>
          </Link>

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
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          <LanguageSwitcher />
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </section>
  );
}
