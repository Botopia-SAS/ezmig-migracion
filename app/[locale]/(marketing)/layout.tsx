'use client';

import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { Footer } from '@/components/footer';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col min-h-screen">
      <FloatingNavbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </section>
  );
}
