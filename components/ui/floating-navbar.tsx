"use client";

import React, { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { HelpCircle, Home, LogOut, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "@/app/[locale]/(login)/actions";
import { User, TeamDataWithMembers } from "@/lib/db/schema";
import useSWR, { mutate } from "swr";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const t = useTranslations("header");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>("/api/user", fetcher);
  const { data: team } = useSWR<TeamDataWithMembers>("/api/team", fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate("/api/user");
    router.push("/");
  }

  if (!user) {
    return (
      <>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="rounded-lg bg-white hover:bg-gray-50 border border-gray-200/50 shadow-sm text-sm font-medium text-gray-700 hover:text-violet-600 px-4 transition-all"
        >
          <Link href="/sign-in">{t("logIn")}</Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-semibold px-4"
        >
          <Link href="/sign-up">{t("getStarted")} →</Link>
        </Button>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link 
        href="/dashboard"
        className="hidden sm:flex items-center gap-2 bg-white/50 hover:bg-white pl-3 pr-1 py-1 rounded-full border border-violet-100 shadow-sm transition-all"
      >
        <span className="text-xs font-medium text-gray-700">{t('goToDashboard')}</span>
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer size-7 hover:opacity-80 transition-opacity">
              <AvatarImage src={team?.logoUrl || undefined} alt={user.name || ""} />
              <AvatarFallback className="text-xs font-bold bg-violet-100 text-violet-700">
                {user.email
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="flex flex-col gap-1">
            <DropdownMenuItem className="cursor-pointer">
              <Link href="/dashboard" className="flex w-full items-center">
                <Home className="mr-2 h-4 w-4" />
                <span>{t("dashboard")}</span>
              </Link>
            </DropdownMenuItem>
            <form action={handleSignOut} className="w-full">
              <button type="submit" className="flex w-full">
                <DropdownMenuItem className="w-full flex-1 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("signOut")}</span>
                </DropdownMenuItem>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </Link>
    </div>
  );
}

export function FloatingNavbar({ className }: { className?: string }) {
  const t = useTranslations("header");
  const { data: user } = useSWR<User>("/api/user", fetcher);
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current === "number") {
      const direction = current - (scrollYProgress.getPrevious() ?? 0);

      if (scrollYProgress.get() < 0.05) {
        setVisible(true);
      } else {
        if (direction < 0) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    }
  });

  const navItems = [
    { href: "/#features", label: t("features") },
    { href: "/#testimonials", label: t("testimonials") },
    { href: "/pricing", label: t("pricing") },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.nav
        initial={{
          opacity: 1,
          y: 0,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "flex fixed top-4 inset-x-0 mx-4 sm:mx-auto sm:max-w-3xl lg:max-w-5xl",
          "border border-violet-200/80 rounded-xl sm:rounded-2xl",
          "bg-[#eadbff]/90 backdrop-blur-md shadow-md shadow-indigo-200/40",
          "z-[5000] px-4 py-2 items-center gap-2",
          className
        )}
      >
        {/* Logo */}
        <Link href="/">
          <img
            src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
            alt="EZMig Logo"
            className="h-7 w-auto"
          />
        </Link>

        {/* Right-aligned content */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Desktop: Nav Links */}
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors rounded-full hover:bg-gray-100"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/#faq"
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors rounded-full hover:bg-gray-100"
            >
              {t("faq")}
              <HelpCircle className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Desktop: Divider */}
          <div className="hidden sm:block w-px h-5 bg-gray-200 mx-1" />

          {/* Desktop: Auth Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Suspense fallback={<div className="h-8 w-20" />}>
              <UserMenu />
            </Suspense>
          </div>

          {/* Desktop: Language Switcher */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Mobile: Hamburger Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden size-10 text-gray-700 hover:text-violet-600"
                aria-label={t("openMenu")}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:hidden p-0" showCloseButton={false}>
              <SheetTitle className="sr-only">Menu</SheetTitle>
              {/* Big close button */}
              <div className="flex items-center justify-between p-4 border-b">
                <img
                  src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
                  alt="EZMig Logo"
                  className="h-7 w-auto"
                />
                <SheetClose className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                  <X className="h-7 w-7 text-gray-700" />
                  <span className="sr-only">Close</span>
                </SheetClose>
              </div>

              <div className="flex flex-col gap-4 p-5">
                {/* Nav Links */}
                <div className="flex flex-col gap-3">
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="text-base font-semibold text-gray-900 hover:text-violet-600"
                    >
                      {item.label}
                    </a>
                  ))}
                  <a
                    href="/#faq"
                    className="flex items-center gap-2 text-base font-semibold text-gray-900 hover:text-violet-600"
                  >
                    {t("faq")}
                    <HelpCircle className="h-4 w-4" />
                  </a>
                </div>

                <div className="h-px bg-gray-200" />

                {/* Auth */}
                <div className="flex items-center gap-3">
                  <Suspense fallback={<div className="h-8 w-20" />}>
                    <UserMenu />
                  </Suspense>
                </div>

                <div className="h-px bg-gray-200" />

                {/* Language Switcher */}
                <div className="flex items-center gap-3">
                  <LanguageSwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.nav>
    </AnimatePresence>
  );
}
