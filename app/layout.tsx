import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

export const metadata: Metadata = {
  title: 'EZMig - Immigration Case Management Made Simple',
  description: 'Complete USCIS forms in minutes, not hours. EZMig helps immigration attorneys manage cases, fill forms accurately, and track USCIS status automatically.',
  keywords: ['immigration', 'USCIS', 'I-130', 'I-485', 'I-589', 'I-765', 'case management', 'immigration attorney'],
  icons: {
    icon: 'https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg',
    apple: 'https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg',
  },
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
