"use client";

import React, { useState, Suspense } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { HelpCircle, Home, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "@/app/[locale]/(login)/actions";
import { User } from "@/lib/db/schema";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const t = useTranslations("header");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>("/api/user", fetcher);
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
          className="text-sm font-medium text-gray-700 hover:text-violet-600"
        >
          <Link href="/sign-in">{t("logIn")}</Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-semibold px-4"
        >
          <Link href="/sign-up">{t("getStarted")} →</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-8">
          <AvatarImage alt={user.name || ""} />
          <AvatarFallback className="text-xs">
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
  );
}

export function FloatingNavbar({ className }: { className?: string }) {
  const t = useTranslations("header");
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(true);

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
          "flex fixed top-4 inset-x-0 mx-4 sm:mx-auto sm:max-w-fit",
          "border border-gray-200 rounded-2xl sm:rounded-full",
          "bg-white/90 backdrop-blur-md shadow-lg shadow-black/5",
          "z-[5000] px-4 py-2 items-center justify-between sm:justify-center gap-2",
          className
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 pr-2">
          <img
            src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
            alt="EZMig Logo"
            className="h-7 w-auto"
          />
          <span className="hidden sm:inline text-lg font-bold text-gray-900">EZMig</span>
        </Link>

        {/* Nav Links */}
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

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-gray-200 mx-1" />

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Auth Buttons */}
        <Suspense fallback={<div className="h-8 w-20" />}>
          <UserMenu />
        </Suspense>
      </motion.nav>
    </AnimatePresence>
  );
}
