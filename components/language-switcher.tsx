'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { useTransition, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function LanguageSwitcher({ theme = 'light' }: { theme?: Theme }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  const isDark = theme === 'dark';
  const buttonClass = `flex items-center gap-1 sm:gap-1.5 border text-sm sm:text-base px-2 sm:px-3 ${
    isDark
      ? 'border-white/50 text-white hover:bg-white/10'
      : 'border-gray-300 text-black hover:bg-gray-50'
  }`;

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleLocaleChange(newLocale: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  }

  // Render placeholder during SSR to avoid Radix UI hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" className={buttonClass} disabled>
        <span className="uppercase">{locale}</span>
        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={buttonClass}
          disabled={isPending}
        >
          <span className="uppercase">{locale}</span>
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={`cursor-pointer ${locale === loc ? 'bg-gray-100' : ''}`}
          >
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
