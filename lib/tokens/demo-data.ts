/**
 * Demo data generators for admin dashboard charts
 * Used when real data is insufficient for visualization
 */

import { dayOfWeekNames } from './chart-utils';

export interface RevenueTimeSeriesPoint {
  date: string;
  tokensSold: number;
  purchaseCount: number;
  autoReloadCount: number;
  estimatedRevenue: number;
}

export interface GrowthTimeSeriesPoint {
  date: string;
  newCount: number;
  cumulativeCount: number;
}

export interface ConsumptionTimeSeriesPoint {
  date: string;
  tokensConsumed: number;
  transactionCount: number;
}

export interface PackagePerformanceData {
  packageId: number;
  name: string;
  tokens: number;
  priceInCents: number;
  purchaseCount: number;
  totalTokensSold: number;
  revenue: number;
}

export interface EngagementMetrics {
  autoReloadAdoptionRate: number;
  repeatPurchaseRate: number;
  activeTenantsRate: number;
  totalTenantsWithWallet: number;
}

export interface ActivityFeedItem {
  id: number;
  action: string;
  timestamp: Date;
  teamName: string | null;
  teamId: number | null;
  userName: string | null;
  userEmail: string | null;
}

export interface DayOfWeekActivity {
  dayOfWeek: number;
  dayName: string;
  activityCount: number;
}

export interface TokenFlowPoint {
  date: string;
  tokensIn: number;
  tokensOut: number;
  netFlow: number;
}

/**
 * Generate demo revenue time series data
 */
export function generateDemoRevenueData(days: number): RevenueTimeSeriesPoint[] {
  const data: RevenueTimeSeriesPoint[] = [];
  const baseTokens = 50;
  const basePurchases = 3;
  const avgTokenPrice = 2.5; // Average price per token in dollars

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Add some variance and weekly pattern (weekends lower)
    const dayOfWeek = date.getDay();
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1;
    const variance = 0.7 + Math.random() * 0.6;

    const tokensSold = Math.floor(baseTokens * variance * weekendFactor);
    const purchaseCount = Math.floor(basePurchases * variance * weekendFactor);
    const autoReloadCount = Math.floor(purchaseCount * 0.3);

    data.push({
      date: dateStr,
      tokensSold,
      purchaseCount,
      autoReloadCount,
      estimatedRevenue: Math.floor(tokensSold * avgTokenPrice),
    });
  }

  return data;
}

/**
 * Generate demo user growth time series
 */
export function generateDemoUserGrowth(days: number): GrowthTimeSeriesPoint[] {
  const data: GrowthTimeSeriesPoint[] = [];
  let cumulative = Math.floor(Math.random() * 100) + 50; // Start with some users

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const newCount = Math.floor(Math.random() * 5) + 1;
    cumulative += newCount;

    data.push({
      date: dateStr,
      newCount,
      cumulativeCount: cumulative,
    });
  }

  return data;
}

/**
 * Generate demo tenant growth time series
 */
export function generateDemoTenantGrowth(days: number): GrowthTimeSeriesPoint[] {
  const data: GrowthTimeSeriesPoint[] = [];
  let cumulative = Math.floor(Math.random() * 30) + 10;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const newCount = Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
    cumulative += newCount;

    data.push({
      date: dateStr,
      newCount,
      cumulativeCount: cumulative,
    });
  }

  return data;
}

/**
 * Generate demo consumption time series
 */
export function generateDemoConsumptionData(days: number): ConsumptionTimeSeriesPoint[] {
  const data: ConsumptionTimeSeriesPoint[] = [];
  const baseConsumption = 20;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayOfWeek = date.getDay();
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.4 : 1;
    const variance = 0.5 + Math.random() * 1;

    const tokensConsumed = Math.floor(baseConsumption * variance * weekendFactor);
    const transactionCount = Math.floor(tokensConsumed * 0.8);

    data.push({
      date: dateStr,
      tokensConsumed,
      transactionCount,
    });
  }

  return data;
}

/**
 * Generate demo package performance data
 */
export function generateDemoPackagePerformance(): PackagePerformanceData[] {
  return [
    { packageId: 1, name: 'Starter', tokens: 5, priceInCents: 1500, purchaseCount: 45, totalTokensSold: 225, revenue: 67500 },
    { packageId: 2, name: 'Basic', tokens: 10, priceInCents: 2900, purchaseCount: 78, totalTokensSold: 780, revenue: 226200 },
    { packageId: 3, name: 'Standard', tokens: 25, priceInCents: 6900, purchaseCount: 52, totalTokensSold: 1300, revenue: 358800 },
    { packageId: 4, name: 'Pro', tokens: 50, priceInCents: 12900, purchaseCount: 23, totalTokensSold: 1150, revenue: 296700 },
    { packageId: 5, name: 'Enterprise', tokens: 100, priceInCents: 24900, purchaseCount: 8, totalTokensSold: 800, revenue: 199200 },
  ];
}

/**
 * Generate demo engagement metrics
 */
export function generateDemoEngagementMetrics(): EngagementMetrics {
  return {
    autoReloadAdoptionRate: Math.floor(Math.random() * 30) + 15, // 15-45%
    repeatPurchaseRate: Math.floor(Math.random() * 40) + 30, // 30-70%
    activeTenantsRate: Math.floor(Math.random() * 30) + 50, // 50-80%
    totalTenantsWithWallet: Math.floor(Math.random() * 50) + 20,
  };
}

/**
 * Generate demo activity feed
 */
export function generateDemoActivityFeed(limit: number): ActivityFeedItem[] {
  const actions = [
    'SIGN_UP',
    'SIGN_IN',
    'PURCHASE_TOKENS',
    'CONSUME_TOKEN',
    'AUTO_RELOAD_TOKENS',
    'INVITE_TEAM_MEMBER',
    'UPDATE_AUTO_RELOAD',
  ];

  const teamNames = [
    'Smith Law Firm',
    'Johnson & Associates',
    'Legal Eagles LLC',
    'Immigration Solutions',
    'Global Visa Services',
  ];

  const userNames = ['John Smith', 'Maria Garcia', 'David Chen', 'Sarah Johnson', 'Michael Brown'];

  const items: ActivityFeedItem[] = [];

  for (let i = 0; i < limit; i++) {
    const minutesAgo = i * Math.floor(Math.random() * 30 + 10);
    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);

    items.push({
      id: i + 1,
      action: actions[Math.floor(Math.random() * actions.length)],
      timestamp,
      teamName: teamNames[Math.floor(Math.random() * teamNames.length)],
      teamId: Math.floor(Math.random() * 100) + 1,
      userName: userNames[Math.floor(Math.random() * userNames.length)],
      userEmail: `user${i + 1}@example.com`,
    });
  }

  return items;
}

/**
 * Generate demo activity by day of week
 */
export function generateDemoActivityByDayOfWeek(): DayOfWeekActivity[] {
  return dayOfWeekNames.map((dayName, index) => ({
    dayOfWeek: index,
    dayName,
    activityCount: index === 0 || index === 6
      ? Math.floor(Math.random() * 20) + 10  // Lower on weekends
      : Math.floor(Math.random() * 50) + 30, // Higher on weekdays
  }));
}

/**
 * Generate demo token flow (purchase vs consumption)
 */
export function generateDemoTokenFlow(days: number): TokenFlowPoint[] {
  const data: TokenFlowPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const tokensIn = Math.floor(Math.random() * 100) + 20;
    const tokensOut = Math.floor(Math.random() * 60) + 10;

    data.push({
      date: dateStr,
      tokensIn,
      tokensOut,
      netFlow: tokensIn - tokensOut,
    });
  }

  return data;
}

/**
 * Generate demo invitation stats
 */
export function generateDemoInvitationStats() {
  const accepted = Math.floor(Math.random() * 50) + 30;
  const pending = Math.floor(Math.random() * 20) + 5;
  const expired = Math.floor(Math.random() * 10) + 2;
  const total = accepted + pending + expired;

  return {
    pending,
    accepted,
    expired,
    conversionRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
  };
}
