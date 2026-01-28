'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Copy } from 'lucide-react';
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

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NewReferralPage() {
  const t = useTranslations('dashboard.referrals');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<{ code: string; url: string } | null>(null);

  // Form state
  const [caseId, setCaseId] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('1');

  // Fetch clients and cases for selection
  const { data: clientsData } = useSWR<{ clients: Client[] }>('/api/clients', fetcher);
  const { data: casesData } = useSWR<{ cases: Case[] }>('/api/cases', fetcher);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {};

      if (caseId) payload.caseId = parseInt(caseId, 10);
      if (clientId) payload.clientId = parseInt(clientId, 10);
      if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();
      if (maxUses) payload.maxUses = parseInt(maxUses, 10);

      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
                    setClientId('');
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

  return (
    <section className="flex-1">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-gray-900">
            <Link href="/dashboard/referrals">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Referral Links
            </Link>
          </Button>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            {t('form.title')}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('form.title')}</CardTitle>
            <CardDescription>
              Create a referral link to invite clients to complete forms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Case Selection */}
              <div className="space-y-2">
                <Label htmlFor="case">{t('form.selectCase')}</Label>
                <Select value={caseId || 'none'} onValueChange={(val) => setCaseId(val === 'none' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.selectCasePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific case</SelectItem>
                    {casesData?.cases?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.caseNumber || c.caseType}
                        {c.client && ` - ${c.client.firstName} ${c.client.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Client Selection (only if no case selected) */}
              {!caseId && (
                <div className="space-y-2">
                  <Label htmlFor="client">{t('form.selectClient')}</Label>
                  <Select value={clientId || 'none'} onValueChange={(val) => setClientId(val === 'none' ? '' : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectClientPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific client</SelectItem>
                      {clientsData?.clients?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.firstName} {c.lastName} ({c.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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

              {/* Submit */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" type="button" asChild>
                  <Link href="/dashboard/referrals">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
                >
                  {isSubmitting ? 'Creating...' : t('newLink')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
