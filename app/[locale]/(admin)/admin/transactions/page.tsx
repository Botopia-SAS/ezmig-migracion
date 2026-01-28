export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';
import { db } from '@/lib/db/drizzle';
import { tokenTransactions, tokenWallets, teams } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { TransactionsTable } from './transactions-table';
import { getTranslations } from 'next-intl/server';

export interface TransactionWithTeam {
  id: number;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: Date;
  teamName: string;
}

async function getAllTransactions(): Promise<TransactionWithTeam[]> {
  const transactions = await db
    .select({
      id: tokenTransactions.id,
      type: tokenTransactions.type,
      amount: tokenTransactions.amount,
      balanceAfter: tokenTransactions.balanceAfter,
      description: tokenTransactions.description,
      createdAt: tokenTransactions.createdAt,
      walletId: tokenTransactions.walletId,
    })
    .from(tokenTransactions)
    .orderBy(desc(tokenTransactions.createdAt))
    .limit(100);

  // Get team info for each transaction
  const transactionsWithTeams = await Promise.all(
    transactions.map(async (tx) => {
      const [wallet] = await db
        .select({ teamId: tokenWallets.teamId })
        .from(tokenWallets)
        .where(eq(tokenWallets.id, tx.walletId))
        .limit(1);

      let teamName = 'Unknown';
      if (wallet) {
        const [team] = await db
          .select({ name: teams.name })
          .from(teams)
          .where(eq(teams.id, wallet.teamId))
          .limit(1);
        teamName = team?.name || 'Unknown';
      }

      return {
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        balanceAfter: tx.balanceAfter,
        description: tx.description,
        createdAt: tx.createdAt,
        teamName,
      };
    })
  );

  return transactionsWithTeams;
}

export default async function TransactionsPage() {
  const t = await getTranslations('admin.transactions');
  const transactions = await getAllTransactions();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <Badge variant="secondary">
          {t('subtitle')}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Coins className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{t('empty')}</p>
            </div>
          ) : (
            <TransactionsTable data={transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
