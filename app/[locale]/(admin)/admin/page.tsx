export const dynamic = 'force-dynamic';

import {
  getAdminDashboardStats,
  getTopTenants,
  getTransactionBreakdown,
  getGlobalTokenStats,
  getRevenueTimeSeries,
  getUserGrowthTimeSeries,
  getTenantGrowthTimeSeries,
  getDailyTokenFlow,
  getPackagePerformance,
  getEngagementMetrics,
  getRecentActivityFeed,
  getActivityByDayOfWeek,
} from '@/lib/tokens/service';
import { db } from '@/lib/db/drizzle';
import { users, teams } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import {
  TopTenantsList,
  TransactionsChart,
  RevenueTrendsChart,
  GrowthChart,
  TokenFlowChart,
  PackagePerformanceChart,
  EngagementRadial,
  ActivityFeed,
  ActivityDayChart,
} from '@/components/admin';
import { StatCard } from '@/components/ui/stat-card';
import { Shield, Building, Users, Coins, DollarSign } from 'lucide-react';

async function getDashboardData() {
  // Use demo data for charts if database has insufficient data
  const useDemoData = false;

  const [
    stats,
    topTenants,
    transactionBreakdown,
    globalStats,
    userCount,
    teamCount,
    revenueTimeSeries,
    userGrowth,
    tenantGrowth,
    tokenFlow,
    packagePerformance,
    engagementMetrics,
    activityFeed,
    activityByDay,
  ] = await Promise.all([
    getAdminDashboardStats(),
    getTopTenants(5),
    getTransactionBreakdown(),
    getGlobalTokenStats(),
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(teams),
    getRevenueTimeSeries(30, useDemoData),
    getUserGrowthTimeSeries(90, useDemoData),
    getTenantGrowthTimeSeries(90, useDemoData),
    getDailyTokenFlow(14, useDemoData),
    getPackagePerformance(useDemoData),
    getEngagementMetrics(useDemoData),
    getRecentActivityFeed(10, useDemoData),
    getActivityByDayOfWeek(useDemoData),
  ]);

  return {
    stats,
    topTenants,
    transactionBreakdown,
    globalStats,
    totalUsers: userCount[0]?.count ?? 0,
    totalTeams: teamCount[0]?.count ?? 0,
    revenueTimeSeries,
    userGrowth,
    tenantGrowth,
    tokenFlow,
    packagePerformance,
    engagementMetrics,
    activityFeed,
    activityByDay,
  };
}

export default async function AdminDashboardPage() {
  const t = await getTranslations('admin.dashboard');
  const data = await getDashboardData();

  const estimatedRevenue = Math.round(data.globalStats.totalPurchased * 2.5);

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-100 rounded-lg">
          <Shield className="h-6 w-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Building className="h-5 w-5 text-blue-600" />}
          value={data.stats.totalTenants.value}
          label={t('stats.totalTenants.label')}
          subLabel={t('stats.totalTenants.sub')}
          change={data.stats.totalTenants.change}
          iconBgColor="bg-blue-100"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-green-600" />}
          value={data.stats.totalUsers.value}
          label={t('stats.totalUsers.label')}
          subLabel={t('stats.totalUsers.sub')}
          change={data.stats.totalUsers.change}
          iconBgColor="bg-green-100"
        />
        <StatCard
          icon={<Coins className="h-5 w-5 text-violet-600" />}
          value={data.stats.tokensConsumed.value}
          label={t('stats.tokensUsed.label')}
          subLabel={t('stats.tokensUsed.sub')}
          change={data.stats.tokensConsumed.change}
          iconBgColor="bg-violet-100"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-white" />}
          value={`${t('currency', { value: estimatedRevenue / 100, style: 'currency', currency: 'USD' })}`}
          label={t('stats.revenue.label')}
          subLabel={t('stats.revenue.sub')}
          variant="highlight"
          iconBgColor="bg-white/20"
        />
      </div>

      {/* Charts Row 1 - Revenue Trends & Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueTrendsChart data={data.revenueTimeSeries} />
        </div>
        <div>
          <EngagementRadial data={data.engagementMetrics} />
        </div>
      </div>

      {/* Charts Row 2 - Growth & Token Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrowthChart userData={data.userGrowth} tenantData={data.tenantGrowth} />
        <TokenFlowChart data={data.tokenFlow} />
      </div>

      {/* Charts Row 3 - Top Tenants, Package Performance, Activity by Day */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopTenantsList tenants={data.topTenants} />
        <PackagePerformanceChart data={data.packagePerformance} />
        <ActivityDayChart data={data.activityByDay} />
      </div>

      {/* Bottom Row - Activity Feed & Transaction Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed items={data.activityFeed} />
        <TransactionsChart
          breakdown={data.transactionBreakdown.breakdown}
          total={data.transactionBreakdown.total}
        />
      </div>

      {/* Token Economy Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Purchased</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.globalStats.totalPurchased.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">tokens</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Consumed</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.globalStats.totalConsumed.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">tokens</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">In Circulation</p>
          <p className="text-2xl font-bold text-violet-600">
            {data.globalStats.totalBalance.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">tokens</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Wallets</p>
          <p className="text-2xl font-bold text-gray-900">{data.globalStats.totalWallets}</p>
          <p className="text-xs text-gray-400">tenants</p>
        </div>
      </div>
    </div>
  );
}
