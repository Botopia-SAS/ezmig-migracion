export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Package, Coins, DollarSign, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { db } from '@/lib/db/drizzle';
import { tokenPackages } from '@/lib/db/schema';
import { createPackageAction, updatePackageAction, deactivatePackageAction } from './actions';
import { getTranslations, getLocale } from 'next-intl/server';

async function getAllPackages() {
  return await db
    .select()
    .from(tokenPackages)
    .orderBy(tokenPackages.sortOrder);
}

export default async function PackagesPage() {
  const t = await getTranslations('admin.packages');
  const locale = await getLocale();
  const packages = await getAllPackages();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <div className="text-sm text-gray-500">
          {t('activeCount', { count: packages.filter(p => p.isActive).length })}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('create.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPackageAction} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('fields.name')}</Label>
              <Input id="name" name="name" placeholder={t('placeholders.name')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tokens">{t('fields.tokens')}</Label>
              <Input id="tokens" name="tokens" type="number" min={1} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceUsd">{t('fields.price')}</Label>
              <Input id="priceUsd" name="priceUsd" type="number" step="0.01" min={0.5} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">{t('fields.sort')}</Label>
              <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={packages.length + 1} />
            </div>
            <div className="space-y-2 flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" />
                {t('fields.active')}
              </label>
              <Button type="submit" className="ml-auto">{t('create.submit')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={!pkg.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-violet-600" />
                  {pkg.name}
                </CardTitle>
                {pkg.isActive ? (
                  <Badge variant="success">
                    <CheckCircle className="h-3 w-3" />
                    {t('status.active')}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3" />
                    {t('status.inactive')}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Coins className="h-4 w-4" />
                    {t('fields.tokens')}
                  </span>
                  <span className="font-semibold text-lg">{pkg.tokens}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    {t('fields.priceShort')}
                  </span>
                  <span className="font-semibold text-lg">{t('money', { value: pkg.priceInCents / 100 })}</span>
                </div>
                <hr />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('fields.pricePerToken')}</span>
                  <span className="text-violet-600 font-medium">
                    {t('money', { value: pkg.priceInCents / 100 / pkg.tokens })}
                  </span>
                </div>
                <div className="text-xs text-gray-400 truncate">Price ID: {pkg.stripePriceId}</div>
                {pkg.stripeProductId && (
                  <div className="text-xs text-gray-400 truncate">Product ID: {pkg.stripeProductId}</div>
                )}
              </div>
            </CardContent>
            <CardContent className="space-y-3">
              <form action={updatePackageAction} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <input type="hidden" name="id" value={pkg.id} />
                <div className="space-y-1">
                  <Label htmlFor={`name-${pkg.id}`}>{t('fields.name')}</Label>
                  <Input id={`name-${pkg.id}`} name="name" defaultValue={pkg.name} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`tokens-${pkg.id}`}>{t('fields.tokens')}</Label>
                  <Input id={`tokens-${pkg.id}`} name="tokens" type="number" min={1} defaultValue={pkg.tokens} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`price-${pkg.id}`}>{t('fields.price')}</Label>
                  <Input id={`price-${pkg.id}`} name="priceUsd" type="number" step="0.01" min={0.5} defaultValue={(pkg.priceInCents / 100).toFixed(2)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`sort-${pkg.id}`}>{t('fields.sort')}</Label>
                  <Input id={`sort-${pkg.id}`} name="sortOrder" type="number" min={0} defaultValue={pkg.sortOrder} />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="isActive" defaultChecked={pkg.isActive} className="h-4 w-4" />
                    {t('fields.active')}
                  </label>
                  <Button type="submit" size="sm" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    {t('update.save')}
                  </Button>
                </div>
              </form>

              {pkg.isActive && (
                <form action={deactivatePackageAction} className="flex justify-end">
                  <input type="hidden" name="id" value={pkg.id} />
                  <Button variant="ghost" size="sm" type="submit">{t('update.deactivate')}</Button>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('help.title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-600">
          <p className="mb-2 text-sm">
            {t('help.body')}
          </p>
          <p className="text-xs text-gray-500">
            {t('help.tip')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
