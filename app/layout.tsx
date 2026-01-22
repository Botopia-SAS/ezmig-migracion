import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

export const metadata: Metadata = {
  title: 'EZMig - Immigration Case Management Made Simple',
  description: 'Complete USCIS forms in minutes, not hours. EZMig helps immigration attorneys manage cases, fill forms accurately, and track USCIS status automatically.',
  keywords: ['immigration', 'USCIS', 'I-130', 'I-485', 'I-589', 'I-765', 'case management', 'immigration attorney'],
  openGraph: {
    title: 'EZMig - Immigration Case Management Made Simple',
    description: 'Complete USCIS forms in minutes, not hours.',
    type: 'website',
  }
};

export const viewport: Viewport = {
  maximumScale: 1
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
