'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Copy } from 'lucide-react';
import { useHeaderActions } from '@/components/dashboard/header-actions-context';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Case {
  id: number;
  caseNumber: string;
  caseType: string;
  client: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

interface FormType {
  id: number;
  code: string;
  name: string;
  category: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NewReferralPage() {
  const t = useTranslations('dashboard.referrals');
  const router = useRouter();
  const { setActions } = useHeaderActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<{ code: string; url: string } | null>(null);

  // Form state
  const [caseId, setCaseId] = useState<string>('');
  const [selectedFormTypeIds, setSelectedFormTypeIds] = useState<number[]>([]);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('1');

  // Fetch cases and form types for selection
  const { data: casesData } = useSWR<{ cases: Case[] }>('/api/cases', fetcher);
  const { data: formTypesData } = useSWR<{ formTypes: FormType[] }>('/api/form-types', fetcher);

  // Set header back navigation
  useEffect(() => {
    setActions(
      <Link href="/dashboard/referrals" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{t('title')}</span>
      </Link>
    );
    return () => setActions(null);
  }, [setActions, t]);

  // Group form types by category
  const formTypesByCategory = (formTypesData?.formTypes || []).reduce<Record<string, FormType[]>>(
    (acc, ft) => {
      const cat = ft.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(ft);
      return acc;
    },
    {}
  );

  const toggleFormType = (id: number) => {
    setSelectedFormTypeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFormTypeIds.length === 0) {
      toast.error(t('form.formTypesRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        formTypeIds: selectedFormTypeIds,
      };

      if (caseId) payload.caseId = parseInt(caseId, 10);
      if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();
      if (maxUses) payload.maxUses = parseInt(maxUses, 10);

      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create referral link');
      }

      const data = await response.json();
      toast.success(t('toast.created'));
      setCreatedLink({ code: data.link.code, url: data.link.url });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink.url);
      toast.success(t('toast.copied'));
    } catch {
      toast.error(t('toast.error'));
    }
  };

  // If link was created, show success state
  if (createdLink) {
    return (
      <section className="flex-1">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Link Created Successfully!</CardTitle>
              <CardDescription>
                Share this link with your client to give them access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Referral Code</Label>
                <div className="mt-1 font-mono text-lg">{createdLink.code}</div>
              </div>

              <div>
                <Label>{t('detail.linkUrl')}</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    readOnly
                    value={createdLink.url}
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/referrals">
                    Back to Referral Links
                  </Link>
                </Button>
                <Button
                  onClick={() => {
                    setCreatedLink(null);
                    setCaseId('');
                    setSelectedFormTypeIds([]);
                    setExpiresAt('');
                    setMaxUses('1');
                  }}
                >
                  Create Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const categoryLabels: Record<string, string> = {
    family: t('formCategories.family'),
    employment: t('formCategories.employment'),
    humanitarian: t('formCategories.humanitarian'),
    naturalization: t('formCategories.naturalization'),
    travel: t('formCategories.travel'),
    other: t('formCategories.other'),
  };

  return (
    <section className="flex-1">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
          {t('form.title')}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left column — Form Types (takes more space) */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">{t('form.selectFormTypes')}</CardTitle>
                <CardDescription>{t('form.selectFormTypesDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[calc(100vh-22rem)] overflow-y-auto">
                  {Object.entries(formTypesByCategory).map(([category, types]) => (
                    <div key={category}>
                      <p className="text-xs font-semibold uppercase text-gray-500 mb-2 sticky top-0 bg-white py-1">
                        {categoryLabels[category] || category}
                      </p>
                      <div className="space-y-1">
                        {types.map((ft) => (
                          <label
                            key={ft.id}
                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                              selectedFormTypeIds.includes(ft.id)
                                ? 'bg-violet-50 border border-violet-200'
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <Checkbox
                              checked={selectedFormTypeIds.includes(ft.id)}
                              onCheckedChange={() => toggleFormType(ft.id)}
                            />
                            <span className="font-mono text-sm font-medium text-violet-700">{ft.code}</span>
                            <span className="text-sm text-gray-700">{ft.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!formTypesData?.formTypes?.length && (
                    <p className="text-sm text-gray-400 text-center py-8">
                      No form types available
                    </p>
                  )}
                </div>
                {selectedFormTypeIds.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                    {selectedFormTypeIds.length} {t('form.formTypesSelected')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Right column — Link Settings */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('form.linkSettings')}</CardTitle>
                  <CardDescription>{t('form.linkSettingsDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Case Selection (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="case">{t('form.selectCase')}</Label>
                    <Select value={caseId || 'none'} onValueChange={(val) => setCaseId(val === 'none' ? '' : val)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.selectCasePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('form.noCase')}</SelectItem>
                        {casesData?.cases?.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.caseNumber || c.caseType}
                            {c.client && ` - ${c.client.firstName} ${c.client.lastName}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Expiration Date */}
                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">{t('form.expiresAt')}</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  {/* Max Uses */}
                  <div className="space-y-2">
                    <Label htmlFor="maxUses">{t('form.maxUses')}</Label>
                    <Select value={maxUses} onValueChange={setMaxUses}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 use</SelectItem>
                        <SelectItem value="5">5 uses</SelectItem>
                        <SelectItem value="10">10 uses</SelectItem>
                        <SelectItem value="25">25 uses</SelectItem>
                        <SelectItem value="50">50 uses</SelectItem>
                        <SelectItem value="100">100 uses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex gap-2">
                <Button variant="outline" type="button" asChild className="flex-1">
                  <Link href="/dashboard/referrals">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || selectedFormTypeIds.length === 0}
                  className="flex-1 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
                >
                  {isSubmitting ? 'Creating...' : t('newLink')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
