'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Check, Loader2, ArrowLeft } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TokenPackage {
  id: number;
  name: string;
  tokens: number;
  priceInCents: number;
  stripePriceId: string;
}

function PackageCard({
  pkg,
  isPopular,
  onSelect,
  isLoading,
}: {
  pkg: TokenPackage;
  isPopular?: boolean;
  onSelect: () => void;
  isLoading: boolean;
}) {
  const t = useTranslations('dashboard.billing.packages');
  const pricePerToken = (pkg.priceInCents / 100 / pkg.tokens).toFixed(2);

  return (
    <Card
      className={`relative ${isPopular ? 'border-violet-500 border-2 shadow-lg' : ''}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-violet-500 text-white text-xs font-medium px-3 py-1 rounded-full">
            {t('mostPopular')}
          </span>
        </div>
      )}
      <CardHeader className="text-center pt-8">
        <div className="mx-auto mb-2 p-3 bg-violet-100 rounded-full w-fit">
          <Coins className="h-6 w-6 text-violet-600" />
        </div>
        <CardTitle className="text-xl">{pkg.name}</CardTitle>
        <div className="mt-2">
          <span className="text-4xl font-bold">${(pkg.priceInCents / 100).toFixed(0)}</span>
        </div>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-3xl font-semibold text-violet-600">{pkg.tokens} {t('tokens')}</p>
        <p className="text-sm text-gray-500 mt-1">${pricePerToken} {t('perToken')}</p>
        <ul className="mt-4 space-y-2 text-sm text-left">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>{pkg.tokens} form submissions</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Never expires</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Instant delivery</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onSelect}
          disabled={isLoading}
          className={`w-full ${isPopular ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('processing')}
            </>
          ) : (
            t('buy')
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function PackagesPage() {
  const t = useTranslations('dashboard.billing.packages');
  const { data, isLoading: isLoadingPackages } = useSWR<{ packages: TokenPackage[] }>(
    '/api/tokens/packages',
    fetcher
  );
  const [loadingPackageId, setLoadingPackageId] = useState<number | null>(null);

  const handleSelectPackage = async (pkg: TokenPackage) => {
    setLoadingPackageId(pkg.id);
    try {
      const response = await fetch('/api/tokens/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL received');
        setLoadingPackageId(null);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setLoadingPackageId(null);
    }
  };

  const packages = data?.packages ?? [];
  // Mark the middle package (25 tokens) as popular
  const popularIndex = Math.floor(packages.length / 2);

  return (
    <section className="flex-1">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/billing">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-gray-900 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            {t('back')}
          </Button>
        </Link>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          {t('title')}
        </h1>
      </div>

      {isLoadingPackages ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : packages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No packages available at the moment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {packages.map((pkg, index) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isPopular={index === popularIndex}
              onSelect={() => handleSelectPackage(pkg)}
              isLoading={loadingPackageId === pkg.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
