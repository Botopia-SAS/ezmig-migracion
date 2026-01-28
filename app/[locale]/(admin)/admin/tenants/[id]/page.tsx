'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Building,
  Users,
  Coins,
  Gift,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { use } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TenantDetails {
  team: {
    id: number;
    name: string;
    type: string;
    autoReloadEnabled: boolean;
    autoReloadThreshold: number | null;
    autoReloadPackage: string | null;
    createdAt: string;
  };
  wallet: {
    id: number;
    balance: number;
  };
  members: Array<{
    id: number;
    role: string;
    user: {
      id: number;
      email: string;
      name: string | null;
    };
  }>;
  recentTransactions: Array<{
    id: number;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    createdAt: string;
  }>;
}

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { data, isLoading, error } = useSWR<TenantDetails>(
    `/api/admin/tenants/${resolvedParams.id}`,
    fetcher
  );

  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [isAddingBonus, setIsAddingBonus] = useState(false);
  const [bonusStatus, setBonusStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleAddBonus = async () => {
    if (!bonusAmount || parseInt(bonusAmount) <= 0) return;

    setIsAddingBonus(true);
    setBonusStatus('idle');

    try {
      const response = await fetch(`/api/admin/tenants/${resolvedParams.id}/bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(bonusAmount),
          reason: bonusReason || 'Admin bonus',
        }),
      });

      if (response.ok) {
        setBonusStatus('success');
        setBonusAmount('');
        setBonusReason('');
        mutate(`/api/admin/tenants/${resolvedParams.id}`);
        setTimeout(() => setBonusStatus('idle'), 3000);
      } else {
        setBonusStatus('error');
      }
    } catch {
      setBonusStatus('error');
    } finally {
      setIsAddingBonus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p className="text-gray-600">Failed to load tenant details</p>
        <Link href="/admin/tenants">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
        </Link>
      </div>
    );
  }

  const { team, wallet, members, recentTransactions } = data;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/tenants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          <p className="text-sm text-gray-500 capitalize">{team.type?.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Token Balance</p>
                  <p className="text-2xl font-bold text-violet-600">{wallet.balance}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Members</p>
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Auto-Reload</p>
                  <p className="font-medium">
                    {team.autoReloadEnabled ? (
                      <span className="text-green-600">Enabled</span>
                    ) : (
                      <span className="text-gray-400">Disabled</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">
                    {new Date(team.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{member.user.name || member.user.email}</p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 border-b last:border-b-0"
                    >
                      <div>
                        <p className="font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500">{tx.description}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </p>
                        <p className="text-xs text-gray-500">Balance: {tx.balanceAfter}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Add Bonus Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Add Bonus Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bonus-amount">Amount</Label>
                <Input
                  id="bonus-amount"
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bonus-reason">Reason (optional)</Label>
                <Input
                  id="bonus-reason"
                  placeholder="e.g., Promotional bonus"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                />
              </div>
              {bonusStatus === 'success' && (
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Bonus tokens added successfully</AlertDescription>
                </Alert>
              )}
              {bonusStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Failed to add bonus tokens</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleAddBonus}
                disabled={isAddingBonus || !bonusAmount}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {isAddingBonus ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Add Tokens
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
