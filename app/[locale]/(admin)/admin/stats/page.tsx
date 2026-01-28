export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart3, TrendingUp, Coins, Users, Building, DollarSign } from 'lucide-react';
import { getGlobalTokenStats } from '@/lib/tokens/service';
import { db } from '@/lib/db/drizzle';
import { users, teams, tokenTransactions, tokenPackages } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';

const transactionBadgeVariants: Record<string, 'success' | 'secondary' | 'info' | 'purple' | 'orange'> = {
  purchase: 'success',
  consumption: 'secondary',
  auto_reload: 'info',
  bonus: 'purple',
  refund: 'orange',
};

async function getDetailedStats() {
  const tokenStats = await getGlobalTokenStats();

  // User counts by role
  const usersByRole = await db
    .select({
      role: users.role,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .groupBy(users.role);

  // Teams by type
  const teamsByType = await db
    .select({
      type: teams.type,
      count: sql<number>`count(*)`,
    })
    .from(teams)
    .groupBy(teams.type);

  // Transactions by type
  const transactionsByType = await db
    .select({
      type: tokenTransactions.type,
      count: sql<number>`count(*)`,
      totalAmount: sql<number>`sum(${tokenTransactions.amount})`,
    })
    .from(tokenTransactions)
    .groupBy(tokenTransactions.type);

  // Revenue calculation (purchases + auto_reload)
  const [revenueData] = await db
    .select({
      totalPurchases: sql<number>`count(case when ${tokenTransactions.type} in ('purchase', 'auto_reload') then 1 end)`,
    })
    .from(tokenTransactions);

  // Get package prices for revenue calculation
  const packages = await db.select().from(tokenPackages);
  const packagePriceMap = packages.reduce((acc, pkg) => {
    acc[pkg.tokens] = pkg.priceInCents;
    return acc;
  }, {} as Record<number, number>);

  // Rough revenue estimate
  const purchaseTransactions = transactionsByType.filter(
    (t) => t.type === 'purchase' || t.type === 'auto_reload'
  );
  const totalTokensSold = purchaseTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  // Estimate revenue (using average price per token)
  const avgPricePerToken = packages.length > 0
    ? packages.reduce((sum, p) => sum + p.priceInCents / p.tokens, 0) / packages.length
    : 0;
  const estimatedRevenue = totalTokensSold * avgPricePerToken;

  return {
    ...tokenStats,
    usersByRole,
    teamsByType,
    transactionsByType,
    totalPurchaseTransactions: revenueData?.totalPurchases ?? 0,
    estimatedRevenue: estimatedRevenue / 100, // Convert to dollars
  };
}

export default async function StatsPage() {
  const t = await getTranslations('admin.stats');
  const stats = await getDetailedStats();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t('cards.revenue.title')}</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.estimatedRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">{t('cards.revenue.subtitle', { count: stats.totalPurchaseTransactions })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t('cards.sold.title')}</CardTitle>
            <TrendingUp className="h-5 w-5 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchased}</div>
            <p className="text-xs text-gray-500">{t('allTime')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t('cards.consumed.title')}</CardTitle>
            <Coins className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConsumed}</div>
            <p className="text-xs text-gray-500">{t('cards.consumed.subtitle')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t('cards.wallets.title')}</CardTitle>
            <Building className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWallets}</div>
            <p className="text-xs text-gray-500">{t('cards.wallets.subtitle', { count: stats.totalBalance })}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
                {t('sections.usersByRole')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.usersByRole.map((item) => (
                <div key={item.role} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                    <span className="capitalize">{item.role}</span>
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Teams by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
                {t('sections.tenantsByType')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.teamsByType.map((item) => (
                <div key={item.type || 'unknown'} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="capitalize">{item.type?.replace('_', ' ') || 'Not set'}</span>
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
                {t('sections.transactions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>{t('table.type')}</TableHead>
                    <TableHead className="text-right">{t('table.count')}</TableHead>
                    <TableHead className="text-right">{t('table.total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.transactionsByType.map((item) => (
                  <TableRow key={item.type}>
                    <TableCell>
                      <Badge variant={transactionBadgeVariants[item.type] || 'secondary'}>
                        {item.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className={`text-right font-medium ${
                      (item.totalAmount ?? 0) > 0 ? 'text-green-600' : 'text-muted-foreground'
                    }`}>
                      {(item.totalAmount ?? 0) > 0 ? '+' : ''}{item.totalAmount ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
