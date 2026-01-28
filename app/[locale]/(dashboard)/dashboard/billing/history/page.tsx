'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TransactionListSkeleton } from '@/components/skeletons/table-skeleton';
import { ArrowLeft, Coins, Zap, RefreshCw, Gift, ArrowDownRight } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TokenTransaction {
  id: number;
  type: 'purchase' | 'consumption' | 'refund' | 'auto_reload' | 'bonus';
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

const transactionIcons: Record<string, React.ElementType> = {
  purchase: Coins,
  consumption: Zap,
  auto_reload: RefreshCw,
  bonus: Gift,
  refund: ArrowDownRight,
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function TransactionRow({ transaction }: { transaction: TokenTransaction }) {
  const t = useTranslations('dashboard.billing.historyPage.types');
  const Icon = transactionIcons[transaction.type] || Coins;
  const isPositive = transaction.amount > 0;
  const label = t(transaction.type);

  return (
    <div className="flex items-center justify-between py-4 border-b last:border-b-0">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-full ${isPositive ? 'bg-green-100' : 'bg-gray-100'}`}>
          <Icon className={`h-5 w-5 ${isPositive ? 'text-green-600' : 'text-gray-600'}`} />
        </div>
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-500">
            {transaction.description || label}
          </p>
          <p className="text-xs text-gray-400">
            {getRelativeTime(new Date(transaction.createdAt))}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${isPositive ? 'text-green-600' : 'text-gray-600'}`}>
          {isPositive ? '+' : ''}{transaction.amount} tokens
        </p>
        <p className="text-sm text-gray-500">
          Balance: {transaction.balanceAfter}
        </p>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const t = useTranslations('dashboard.billing.historyPage');
  const { data, isLoading } = useSWR<{ transactions: TokenTransaction[] }>(
    '/api/tokens/history',
    fetcher
  );

  const transactions = data?.transactions ?? [];

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/billing">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          {t('title')}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TransactionListSkeleton rows={5} />
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Coins className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">{t('noTransactions')}</p>
              <p className="text-sm mt-1">{t('noTransactionsDescription')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
