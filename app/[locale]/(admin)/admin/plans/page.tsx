'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Loader2, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { updatePlanPrice, updatePlanFeatures } from './actions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PlanData {
  id: string;
  name: string;
  description: string | null;
  priceId: string | null;
  price: number;
  interval: string;
  features: string[];
  tier: string;
}

interface PlansResponse {
  plans: PlanData[];
  currentPlan: string | null;
  subscriptionStatus: string | null;
}

function PlanCard({ plan }: { plan: PlanData }) {
  const t = useTranslations('admin.plans');
  const [newPrice, setNewPrice] = useState('');
  const [featuresText, setFeaturesText] = useState(plan.features.join('\n'));
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [isUpdatingFeatures, setIsUpdatingFeatures] = useState(false);
  const [status, setStatus] = useState<'idle' | 'priceSuccess' | 'featuresSuccess' | 'error'>('idle');

  const handleUpdatePrice = async () => {
    const cents = Math.round(parseFloat(newPrice) * 100);
    if (!cents || cents <= 0) return;

    setIsUpdatingPrice(true);
    setStatus('idle');
    try {
      await updatePlanPrice(plan.id, cents);
      setStatus('priceSuccess');
      setNewPrice('');
      mutate('/api/billing/plans');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleUpdateFeatures = async () => {
    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
    if (!features.length) return;

    setIsUpdatingFeatures(true);
    setStatus('idle');
    try {
      await updatePlanFeatures(plan.id, features);
      setStatus('featuresSuccess');
      mutate('/api/billing/plans');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
    } finally {
      setIsUpdatingFeatures(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-violet-500" />
            {plan.name}
          </div>
          <Badge variant="secondary" className="capitalize">{plan.tier}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Price */}
        <div>
          <p className="text-sm text-gray-500 mb-1">{t('currentPrice')}</p>
          <p className="text-3xl font-bold text-gray-900">
            ${(plan.price / 100).toFixed(2)}
            <span className="text-sm font-normal text-gray-500">{t('perMonth')}</span>
          </p>
        </div>

        {/* Update Price */}
        <div className="space-y-2">
          <Label>{t('newPrice')}</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="29.99"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              onClick={handleUpdatePrice}
              disabled={isUpdatingPrice || !newPrice}
              size="sm"
            >
              {isUpdatingPrice ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('updatePrice')
              )}
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <Label>{t('features')}</Label>
          <Textarea
            value={featuresText}
            onChange={(e) => setFeaturesText(e.target.value)}
            rows={4}
            placeholder="One feature per line"
          />
          <Button
            onClick={handleUpdateFeatures}
            disabled={isUpdatingFeatures}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isUpdatingFeatures ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {t('updateFeatures')}
          </Button>
        </div>

        {/* Status Messages */}
        {status === 'priceSuccess' && (
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{t('priceUpdated')}</AlertDescription>
          </Alert>
        )}
        {status === 'featuresSuccess' && (
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{t('featuresUpdated')}</AlertDescription>
          </Alert>
        )}
        {status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Something went wrong. Please try again.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlansPage() {
  const t = useTranslations('admin.plans');
  const { data, isLoading } = useSWR<PlansResponse>('/api/billing/plans', fetcher);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-violet-100 rounded-lg">
          <CreditCard className="h-6 w-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : !data?.plans?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>{t('noPlans')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
