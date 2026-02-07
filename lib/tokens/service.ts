import { db } from '@/lib/db/drizzle';
import { eq, and, sql } from 'drizzle-orm';
import {
  tokenWallets,
  tokenTransactions,
  tokenPackages,
  teams,
  teamMembers,
  users,
  activityLogs,
  ActivityType,
  type TokenWallet,
  type TokenTransaction,
  type TokenPackage,
} from '@/lib/db/schema';
import { logActivity } from '@/lib/activity/service';
import {
  sendLowBalanceNotification,
  sendAutoReloadSuccessNotification,
  sendAutoReloadFailureNotification,
} from '@/lib/email/service';

// ============================================
// WALLET OPERATIONS
// ============================================

/**
 * Get wallet by team ID
 */
export async function getWalletByTeamId(teamId: number): Promise<TokenWallet | null> {
  const [wallet] = await db
    .select()
    .from(tokenWallets)
    .where(eq(tokenWallets.teamId, teamId))
    .limit(1);

  return wallet || null;
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(teamId: number): Promise<number> {
  const wallet = await getWalletByTeamId(teamId);
  return wallet?.balance ?? 0;
}

/**
 * Create wallet for a team (called during signup)
 */
export async function createWalletForTeam(teamId: number): Promise<TokenWallet> {
  const [wallet] = await db
    .insert(tokenWallets)
    .values({
      teamId,
      balance: 0,
    })
    .returning();

  return wallet;
}

// ============================================
// TOKEN PACKAGES
// ============================================

/**
 * Get all active token packages
 */
export async function getActivePackages(): Promise<TokenPackage[]> {
  return await db
    .select()
    .from(tokenPackages)
    .where(eq(tokenPackages.isActive, true))
    .orderBy(tokenPackages.sortOrder);
}

/**
 * Get package by ID
 */
export async function getPackageById(packageId: number): Promise<TokenPackage | null> {
  const [pkg] = await db
    .select()
    .from(tokenPackages)
    .where(eq(tokenPackages.id, packageId))
    .limit(1);

  return pkg || null;
}

/**
 * Get package by Stripe price ID
 */
export async function getPackageByStripePriceId(stripePriceId: string): Promise<TokenPackage | null> {
  const [pkg] = await db
    .select()
    .from(tokenPackages)
    .where(eq(tokenPackages.stripePriceId, stripePriceId))
    .limit(1);

  return pkg || null;
}

// ============================================
// PURCHASE TOKENS
// ============================================

/**
 * Purchase tokens after successful Stripe payment
 */
export async function purchaseTokens({
  teamId,
  packageId,
  stripePaymentIntentId,
  userId,
  type = 'purchase',
}: {
  teamId: number;
  packageId: number;
  stripePaymentIntentId: string;
  userId?: number;
  type?: 'purchase' | 'auto_reload';
}): Promise<TokenTransaction> {
  // Idempotency check: if this payment intent was already processed, return existing transaction
  const [existingTransaction] = await db
    .select()
    .from(tokenTransactions)
    .where(eq(tokenTransactions.stripePaymentIntentId, stripePaymentIntentId))
    .limit(1);

  if (existingTransaction) {
    console.log(`Payment intent ${stripePaymentIntentId} already processed, returning existing transaction`);
    return existingTransaction;
  }

  const pkg = await getPackageById(packageId);
  if (!pkg) {
    throw new Error(`Package with ID ${packageId} not found`);
  }

  // Get or create wallet for the team
  let wallet = await getWalletByTeamId(teamId);
  if (!wallet) {
    // Auto-create wallet if it doesn't exist
    wallet = await createWalletForTeam(teamId);
  }

  const newBalance = wallet.balance + pkg.tokens;

  // Update wallet balance
  await db
    .update(tokenWallets)
    .set({
      balance: newBalance,
      updatedAt: new Date(),
    })
    .where(eq(tokenWallets.id, wallet.id));

  // Create transaction record
  const [transaction] = await db
    .insert(tokenTransactions)
    .values({
      walletId: wallet.id,
      type,
      amount: pkg.tokens,
      balanceAfter: newBalance,
      stripePaymentIntentId,
      description: `Purchased ${pkg.name} package (${pkg.tokens} tokens)`,
      userId,
    })
    .returning();

  // Log activity
  await logActivity({
    teamId,
    userId: userId ?? null,
    action: type === 'auto_reload' ? ActivityType.AUTO_RELOAD_TOKENS : ActivityType.PURCHASE_TOKENS,
    entityType: 'token',
    entityId: transaction.id,
    entityName: `${pkg.name} (${pkg.tokens} tokens)`,
  });

  return transaction;
}

// ============================================
// CONSUME TOKENS (IDEMPOTENT)
// ============================================

interface ConsumeResult {
  success: boolean;
  transaction?: TokenTransaction;
  error?: string;
  newBalance?: number;
}

/**
 * Consume a token (idempotent operation)
 * Returns existing transaction if idempotencyKey was already used
 */
export async function consumeToken({
  teamId,
  idempotencyKey,
  description,
  userId,
  relatedEntityType,
  relatedEntityId,
}: {
  teamId: number;
  idempotencyKey: string;
  description: string;
  userId?: number;
  relatedEntityType?: string;
  relatedEntityId?: number;
}): Promise<ConsumeResult> {
  // Check if transaction with this idempotency key already exists
  const [existingTransaction] = await db
    .select()
    .from(tokenTransactions)
    .where(eq(tokenTransactions.idempotencyKey, idempotencyKey))
    .limit(1);

  if (existingTransaction) {
    // Already processed - return existing transaction (idempotent)
    return {
      success: true,
      transaction: existingTransaction,
      newBalance: existingTransaction.balanceAfter,
    };
  }

  const wallet = await getWalletByTeamId(teamId);
  if (!wallet) {
    return { success: false, error: 'Wallet not found' };
  }

  if (wallet.balance < 1) {
    return { success: false, error: 'Insufficient tokens' };
  }

  const newBalance = wallet.balance - 1;

  // Update wallet balance
  await db
    .update(tokenWallets)
    .set({
      balance: newBalance,
      updatedAt: new Date(),
    })
    .where(eq(tokenWallets.id, wallet.id));

  // Create transaction record
  const [transaction] = await db
    .insert(tokenTransactions)
    .values({
      walletId: wallet.id,
      type: 'consumption',
      amount: -1,
      balanceAfter: newBalance,
      idempotencyKey,
      description,
      userId,
      relatedEntityType,
      relatedEntityId,
    })
    .returning();

  // Log activity
  await logActivity({
    teamId,
    userId: userId ?? null,
    action: ActivityType.CONSUME_TOKEN,
    entityType: 'token',
    entityId: transaction.id,
    metadata: { description, relatedEntityType, relatedEntityId },
  });

  // Check if auto-reload should be triggered
  await checkAndTriggerAutoReload(teamId);

  return {
    success: true,
    transaction,
    newBalance,
  };
}

// ============================================
// AUTO-RELOAD
// ============================================

/**
 * Get team owner email for notifications
 */
async function getTeamOwnerEmail(teamId: number): Promise<string | null> {
  const [ownerMember] = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.role, 'owner')))
    .limit(1);

  if (!ownerMember) return null;

  const [owner] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, ownerMember.userId))
    .limit(1);

  return owner?.email || null;
}

/**
 * Check if auto-reload should be triggered and execute if needed
 * Returns true if auto-reload was triggered
 */
export async function checkAndTriggerAutoReload(teamId: number): Promise<boolean> {
  // Get team settings
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) return false;

  const wallet = await getWalletByTeamId(teamId);
  if (!wallet) return false;

  const threshold = team.autoReloadThreshold ?? 5;

  // If balance is above threshold, no action needed
  if (wallet.balance >= threshold) {
    return false;
  }

  // Get owner email for notifications
  const ownerEmail = await getTeamOwnerEmail(teamId);

  // If auto-reload is NOT enabled, send low balance notification
  if (!team.autoReloadEnabled) {
    if (ownerEmail) {
      await sendLowBalanceNotification({
        email: ownerEmail,
        teamName: team.name,
        currentBalance: wallet.balance,
        threshold,
      });
    }
    return false;
  }

  // Find the package to reload
  const packageName = team.autoReloadPackage ?? '10';
  const packages = await getActivePackages();
  const reloadPackage = packages.find((p) => p.tokens.toString() === packageName);

  if (!reloadPackage) {
    console.error(`Auto-reload package "${packageName}" not found`);
    return false;
  }

  // Check if team has a Stripe customer with default payment method
  if (!team.stripeCustomerId) {
    console.log(`Team ${teamId} has no Stripe customer ID for auto-reload`);
    return false;
  }

  try {
    // Dynamic import to avoid circular dependencies
    const { executeAutoReload } = await import('@/lib/payments/stripe');

    const transaction = await executeAutoReload({
      teamId,
      customerId: team.stripeCustomerId,
      packageId: reloadPackage.id,
    });

    if (transaction) {
      console.log(`Auto-reload successful for team ${teamId}: ${reloadPackage.tokens} tokens`);

      // Send success notification
      if (ownerEmail) {
        await sendAutoReloadSuccessNotification({
          email: ownerEmail,
          teamName: team.name,
          tokensAdded: reloadPackage.tokens,
          amountCharged: reloadPackage.priceInCents,
          newBalance: transaction.balanceAfter,
        });
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error(`Auto-reload failed for team ${teamId}:`, error);

    // Send failure notification
    if (ownerEmail) {
      await sendAutoReloadFailureNotification({
        email: ownerEmail,
        teamName: team.name,
        currentBalance: wallet.balance,
        errorMessage: error instanceof Error ? error.message : undefined,
      });
    }

    return false;
  }
}

/**
 * Update auto-reload settings for a team
 */
export async function updateAutoReloadSettings({
  teamId,
  enabled,
  threshold,
  packageTokens,
  userId,
}: {
  teamId: number;
  enabled: boolean;
  threshold?: number;
  packageTokens?: string;
  userId?: number;
}): Promise<void> {
  await db
    .update(teams)
    .set({
      autoReloadEnabled: enabled,
      ...(threshold !== undefined && { autoReloadThreshold: threshold }),
      ...(packageTokens !== undefined && { autoReloadPackage: packageTokens }),
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));

  // Log activity
  await logActivity({
    teamId,
    userId: userId ?? null,
    action: ActivityType.UPDATE_AUTO_RELOAD,
    entityType: 'team',
    entityId: teamId,
    metadata: { enabled, threshold, packageTokens },
  });
}

// ============================================
// TRANSACTION HISTORY
// ============================================

/**
 * Get transaction history for a team
 */
export async function getTransactionHistory(
  teamId: number,
  limit = 50,
  offset = 0
): Promise<TokenTransaction[]> {
  const wallet = await getWalletByTeamId(teamId);
  if (!wallet) {
    return [];
  }

  return await db
    .select()
    .from(tokenTransactions)
    .where(eq(tokenTransactions.walletId, wallet.id))
    .orderBy(sql`${tokenTransactions.createdAt} DESC`)
    .limit(limit)
    .offset(offset);
}

// ============================================
// ADMIN OPERATIONS
// ============================================

/**
 * Add bonus tokens to a team (admin only)
 */
export async function addBonusTokens({
  teamId,
  amount,
  description,
  adminUserId,
}: {
  teamId: number;
  amount: number;
  description: string;
  adminUserId: number;
}): Promise<TokenTransaction> {
  const wallet = await getWalletByTeamId(teamId);
  if (!wallet) {
    throw new Error(`Wallet for team ${teamId} not found`);
  }

  const newBalance = wallet.balance + amount;

  // Update wallet balance
  await db
    .update(tokenWallets)
    .set({
      balance: newBalance,
      updatedAt: new Date(),
    })
    .where(eq(tokenWallets.id, wallet.id));

  // Create transaction record
  const [transaction] = await db
    .insert(tokenTransactions)
    .values({
      walletId: wallet.id,
      type: 'bonus',
      amount,
      balanceAfter: newBalance,
      description,
      userId: adminUserId,
    })
    .returning();

  return transaction;
}

/**
 * Get all wallets with team info (admin only)
 */
export async function getAllWalletsWithTeams() {
  return await db
    .select({
      wallet: tokenWallets,
      team: teams,
    })
    .from(tokenWallets)
    .innerJoin(teams, eq(tokenWallets.teamId, teams.id))
    .orderBy(sql`${teams.createdAt} DESC`);
}

/**
 * Get global token statistics (admin only)
 */
export async function getGlobalTokenStats() {
  const [stats] = await db
    .select({
      totalWallets: sql<number>`count(*)`.as('totalWallets'),
      totalBalance: sql<number>`coalesce(sum(${tokenWallets.balance}), 0)`.as('totalBalance'),
    })
    .from(tokenWallets);

  const [transactionStats] = await db
    .select({
      totalPurchased: sql<number>`coalesce(sum(case when ${tokenTransactions.type} in ('purchase', 'auto_reload', 'bonus') then ${tokenTransactions.amount} else 0 end), 0)`.as('totalPurchased'),
      totalConsumed: sql<number>`coalesce(sum(case when ${tokenTransactions.type} = 'consumption' then abs(${tokenTransactions.amount}) else 0 end), 0)`.as('totalConsumed'),
    })
    .from(tokenTransactions);

  return {
    totalWallets: Number(stats?.totalWallets) || 0,
    totalBalance: Number(stats?.totalBalance) || 0,
    totalPurchased: Number(transactionStats?.totalPurchased) || 0,
    totalConsumed: Number(transactionStats?.totalConsumed) || 0,
  };
}

// ============================================
// ADMIN DASHBOARD STATS (Enhanced)
// ============================================

interface StatWithChange {
  value: number;
  change: number; // percentage change from previous period
}

interface AdminDashboardStats {
  totalTenants: StatWithChange;
  totalUsers: StatWithChange;
  tokensConsumed: StatWithChange;
  revenue: StatWithChange;
}

/**
 * Get admin dashboard stats with trend percentages
 * Compares current week vs previous week
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date();
  // Convert dates to ISO strings for SQL compatibility
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Total tenants
  const [tenantsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(teams);

  const [tenantsLastWeek] = await db
    .select({ count: sql<number>`count(*)` })
    .from(teams)
    .where(sql`${teams.createdAt} < ${oneWeekAgo}::timestamp`);

  // Total users
  const [usersCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  const [usersLastWeek] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(sql`${users.createdAt} < ${oneWeekAgo}::timestamp`);

  // Tokens consumed this week vs last week
  const [consumedThisWeek] = await db
    .select({
      total: sql<number>`coalesce(sum(abs(${tokenTransactions.amount})), 0)`,
    })
    .from(tokenTransactions)
    .where(
      and(
        eq(tokenTransactions.type, 'consumption'),
        sql`${tokenTransactions.createdAt} >= ${oneWeekAgo}::timestamp`
      )
    );

  const [consumedLastWeek] = await db
    .select({
      total: sql<number>`coalesce(sum(abs(${tokenTransactions.amount})), 0)`,
    })
    .from(tokenTransactions)
    .where(
      and(
        eq(tokenTransactions.type, 'consumption'),
        sql`${tokenTransactions.createdAt} >= ${twoWeeksAgo}::timestamp`,
        sql`${tokenTransactions.createdAt} < ${oneWeekAgo}::timestamp`
      )
    );

  // Revenue (purchases this week vs last week)
  const [revenueThisWeek] = await db
    .select({
      total: sql<number>`coalesce(sum(${tokenTransactions.amount}), 0)`,
    })
    .from(tokenTransactions)
    .where(
      and(
        sql`${tokenTransactions.type} in ('purchase', 'auto_reload')`,
        sql`${tokenTransactions.createdAt} >= ${oneWeekAgo}::timestamp`
      )
    );

  const [revenueLastWeek] = await db
    .select({
      total: sql<number>`coalesce(sum(${tokenTransactions.amount}), 0)`,
    })
    .from(tokenTransactions)
    .where(
      and(
        sql`${tokenTransactions.type} in ('purchase', 'auto_reload')`,
        sql`${tokenTransactions.createdAt} >= ${twoWeeksAgo}::timestamp`,
        sql`${tokenTransactions.createdAt} < ${oneWeekAgo}::timestamp`
      )
    );

  const calcChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const currentTenants = tenantsCount?.count ?? 0;
  const previousTenants = tenantsLastWeek?.count ?? 0;
  const newTenants = currentTenants - previousTenants;

  const currentUsers = usersCount?.count ?? 0;
  const previousUsers = usersLastWeek?.count ?? 0;
  const newUsers = currentUsers - previousUsers;

  return {
    totalTenants: {
      value: currentTenants,
      change: previousTenants > 0 ? calcChange(currentTenants, previousTenants) : (newTenants > 0 ? 100 : 0),
    },
    totalUsers: {
      value: currentUsers,
      change: previousUsers > 0 ? calcChange(currentUsers, previousUsers) : (newUsers > 0 ? 100 : 0),
    },
    tokensConsumed: {
      value: consumedThisWeek?.total ?? 0,
      change: calcChange(consumedThisWeek?.total ?? 0, consumedLastWeek?.total ?? 0),
    },
    revenue: {
      value: revenueThisWeek?.total ?? 0,
      change: calcChange(revenueThisWeek?.total ?? 0, revenueLastWeek?.total ?? 0),
    },
  };
}

interface TopTenant {
  id: number;
  name: string;
  tokensUsed: number;
  balance: number;
  transactionCount: number;
}

/**
 * Get top tenants by token consumption
 */
export async function getTopTenants(limit = 5): Promise<TopTenant[]> {
  const results = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      balance: tokenWallets.balance,
      tokensUsed: sql<number>`coalesce(sum(case when ${tokenTransactions.type} = 'consumption' then abs(${tokenTransactions.amount}) else 0 end), 0)`,
      transactionCount: sql<number>`count(${tokenTransactions.id})`,
    })
    .from(teams)
    .leftJoin(tokenWallets, eq(teams.id, tokenWallets.teamId))
    .leftJoin(tokenTransactions, eq(tokenWallets.id, tokenTransactions.walletId))
    .groupBy(teams.id, teams.name, tokenWallets.balance)
    .orderBy(sql`coalesce(sum(case when ${tokenTransactions.type} = 'consumption' then abs(${tokenTransactions.amount}) else 0 end), 0) DESC`)
    .limit(limit);

  return results.map((r) => ({
    id: r.teamId,
    name: r.teamName,
    tokensUsed: r.tokensUsed ?? 0,
    balance: r.balance ?? 0,
    transactionCount: r.transactionCount ?? 0,
  }));
}

interface TransactionTypeBreakdown {
  type: string;
  count: number;
  total: number;
  percentage: number;
}

/**
 * Get transaction breakdown by type
 */
export async function getTransactionBreakdown(): Promise<{
  breakdown: TransactionTypeBreakdown[];
  total: number;
}> {
  const results = await db
    .select({
      type: tokenTransactions.type,
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(abs(${tokenTransactions.amount})), 0)`,
    })
    .from(tokenTransactions)
    .groupBy(tokenTransactions.type);

  const totalCount = results.reduce((sum, r) => sum + (r.count ?? 0), 0);

  const breakdown = results.map((r) => ({
    type: r.type,
    count: r.count ?? 0,
    total: r.total ?? 0,
    percentage: totalCount > 0 ? Math.round(((r.count ?? 0) / totalCount) * 100) : 0,
  }));

  return { breakdown, total: totalCount };
}

interface SystemAlert {
  message: string;
  count: number;
  time: string;
}

interface SystemAlerts {
  critical: SystemAlert[];
  warnings: SystemAlert[];
}

/**
 * Get system alerts for admin dashboard
 */
export async function getSystemAlerts(): Promise<SystemAlerts> {
  const critical: SystemAlert[] = [];
  const warnings: SystemAlert[] = [];

  // Critical: Tenants with very low balance (< 3 tokens)
  const [lowBalanceCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tokenWallets)
    .where(sql`${tokenWallets.balance} < 3 AND ${tokenWallets.balance} >= 0`);

  if ((lowBalanceCount?.count ?? 0) > 0) {
    critical.push({
      message: 'Tenants with low balance (< 3 tokens)',
      count: lowBalanceCount?.count ?? 0,
      time: 'Current',
    });
  }

  // Critical: Tenants with zero balance
  const [zeroBalanceCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tokenWallets)
    .where(eq(tokenWallets.balance, 0));

  if ((zeroBalanceCount?.count ?? 0) > 0) {
    critical.push({
      message: 'Tenants with zero balance',
      count: zeroBalanceCount?.count ?? 0,
      time: 'Current',
    });
  }

  // Warning: Tenants without auto-reload enabled
  const [noAutoReloadCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(teams)
    .leftJoin(tokenWallets, eq(teams.id, tokenWallets.teamId))
    .where(
      and(
        eq(teams.autoReloadEnabled, false),
        sql`${tokenWallets.id} IS NOT NULL`
      )
    );

  if ((noAutoReloadCount?.count ?? 0) > 0) {
    warnings.push({
      message: 'Tenants without auto-reload',
      count: noAutoReloadCount?.count ?? 0,
      time: 'Current',
    });
  }

  // Warning: Tenants without Stripe customer ID (can't buy tokens)
  const [noStripeCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(teams)
    .leftJoin(tokenWallets, eq(teams.id, tokenWallets.teamId))
    .where(
      and(
        sql`${teams.stripeCustomerId} IS NULL`,
        sql`${tokenWallets.id} IS NOT NULL`
      )
    );

  if ((noStripeCount?.count ?? 0) > 0) {
    warnings.push({
      message: 'Tenants without payment method',
      count: noStripeCount?.count ?? 0,
      time: 'Current',
    });
  }

  return { critical, warnings };
}

// ============================================
// ENHANCED ADMIN DASHBOARD - TIME SERIES
// ============================================

import {
  fillMissingDates,
  type TimeSeriesPoint,
} from './chart-utils';
import {
  generateDemoRevenueData,
  generateDemoUserGrowth,
  generateDemoTenantGrowth,
  generateDemoConsumptionData,
  generateDemoPackagePerformance,
  generateDemoEngagementMetrics,
  generateDemoActivityFeed,
  generateDemoActivityByDayOfWeek,
  generateDemoTokenFlow,
  generateDemoInvitationStats,
  type RevenueTimeSeriesPoint,
  type GrowthTimeSeriesPoint,
  type ConsumptionTimeSeriesPoint,
  type PackagePerformanceData,
  type EngagementMetrics,
  type ActivityFeedItem,
  type DayOfWeekActivity,
  type TokenFlowPoint,
} from './demo-data';

/**
 * Get revenue time series for the last N days
 */
export async function getRevenueTimeSeries(days = 30, useDemoData = false): Promise<RevenueTimeSeriesPoint[]> {
  if (useDemoData) {
    return generateDemoRevenueData(days);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  const results = await db
    .select({
      date: sql<string>`DATE(${tokenTransactions.createdAt})`.as('date'),
      tokensSold: sql<number>`coalesce(sum(case when ${tokenTransactions.type} in ('purchase', 'auto_reload') then ${tokenTransactions.amount} else 0 end), 0)`.as('tokensSold'),
      purchaseCount: sql<number>`count(case when ${tokenTransactions.type} = 'purchase' then 1 end)`.as('purchaseCount'),
      autoReloadCount: sql<number>`count(case when ${tokenTransactions.type} = 'auto_reload' then 1 end)`.as('autoReloadCount'),
    })
    .from(tokenTransactions)
    .where(sql`${tokenTransactions.createdAt} >= ${startDateStr}::timestamp`)
    .groupBy(sql`DATE(${tokenTransactions.createdAt})`)
    .orderBy(sql`DATE(${tokenTransactions.createdAt}) ASC`);

  const data = results.map(r => ({
    date: r.date,
    tokensSold: r.tokensSold ?? 0,
    purchaseCount: r.purchaseCount ?? 0,
    autoReloadCount: r.autoReloadCount ?? 0,
    estimatedRevenue: Math.round((r.tokensSold ?? 0) * 2.5), // Avg $2.50 per token
  }));

  return fillMissingDates(data, days, {
    tokensSold: 0,
    purchaseCount: 0,
    autoReloadCount: 0,
    estimatedRevenue: 0,
  });
}

/**
 * Get user growth time series for the last N days
 */
export async function getUserGrowthTimeSeries(days = 90, useDemoData = false): Promise<GrowthTimeSeriesPoint[]> {
  if (useDemoData) {
    return generateDemoUserGrowth(days);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  // Get cumulative count up to start date
  const [initialCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(sql`${users.createdAt} < ${startDateStr}::timestamp`);

  // Get daily new users
  const results = await db
    .select({
      date: sql<string>`DATE(${users.createdAt})`.as('date'),
      newCount: sql<number>`count(*)`.as('newCount'),
    })
    .from(users)
    .where(sql`${users.createdAt} >= ${startDateStr}::timestamp`)
    .groupBy(sql`DATE(${users.createdAt})`)
    .orderBy(sql`DATE(${users.createdAt}) ASC`);

  let cumulative = initialCount?.count ?? 0;
  const data = results.map(r => {
    cumulative += r.newCount ?? 0;
    return {
      date: r.date,
      newCount: r.newCount ?? 0,
      cumulativeCount: cumulative,
    };
  });

  // Fill missing dates
  const lastCumulative = data.length > 0 ? data[data.length - 1].cumulativeCount : (initialCount?.count ?? 0);
  return fillMissingDates(data, days, {
    newCount: 0,
    cumulativeCount: lastCumulative,
  });
}

/**
 * Get tenant growth time series for the last N days
 */
export async function getTenantGrowthTimeSeries(days = 90, useDemoData = false): Promise<GrowthTimeSeriesPoint[]> {
  if (useDemoData) {
    return generateDemoTenantGrowth(days);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  // Get cumulative count up to start date
  const [initialCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(teams)
    .where(sql`${teams.createdAt} < ${startDateStr}::timestamp`);

  // Get daily new tenants
  const results = await db
    .select({
      date: sql<string>`DATE(${teams.createdAt})`.as('date'),
      newCount: sql<number>`count(*)`.as('newCount'),
    })
    .from(teams)
    .where(sql`${teams.createdAt} >= ${startDateStr}::timestamp`)
    .groupBy(sql`DATE(${teams.createdAt})`)
    .orderBy(sql`DATE(${teams.createdAt}) ASC`);

  let cumulative = initialCount?.count ?? 0;
  const data = results.map(r => {
    cumulative += r.newCount ?? 0;
    return {
      date: r.date,
      newCount: r.newCount ?? 0,
      cumulativeCount: cumulative,
    };
  });

  const lastCumulative = data.length > 0 ? data[data.length - 1].cumulativeCount : (initialCount?.count ?? 0);
  return fillMissingDates(data, days, {
    newCount: 0,
    cumulativeCount: lastCumulative,
  });
}

/**
 * Get token consumption time series for the last N days
 */
export async function getTokenConsumptionTimeSeries(days = 14, useDemoData = false): Promise<ConsumptionTimeSeriesPoint[]> {
  if (useDemoData) {
    return generateDemoConsumptionData(days);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  const results = await db
    .select({
      date: sql<string>`DATE(${tokenTransactions.createdAt})`.as('date'),
      tokensConsumed: sql<number>`coalesce(sum(abs(${tokenTransactions.amount})), 0)`.as('tokensConsumed'),
      transactionCount: sql<number>`count(*)`.as('transactionCount'),
    })
    .from(tokenTransactions)
    .where(
      and(
        eq(tokenTransactions.type, 'consumption'),
        sql`${tokenTransactions.createdAt} >= ${startDateStr}::timestamp`
      )
    )
    .groupBy(sql`DATE(${tokenTransactions.createdAt})`)
    .orderBy(sql`DATE(${tokenTransactions.createdAt}) ASC`);

  const data = results.map(r => ({
    date: r.date,
    tokensConsumed: r.tokensConsumed ?? 0,
    transactionCount: r.transactionCount ?? 0,
  }));

  return fillMissingDates(data, days, {
    tokensConsumed: 0,
    transactionCount: 0,
  });
}

/**
 * Get package performance metrics
 */
export async function getPackagePerformance(useDemoData = false): Promise<PackagePerformanceData[]> {
  if (useDemoData) {
    return generateDemoPackagePerformance();
  }

  // Get all active packages
  const packages = await getActivePackages();

  // Get transaction counts per package by matching description
  const results = await Promise.all(
    packages.map(async (pkg) => {
      const [stats] = await db
        .select({
          purchaseCount: sql<number>`count(*)`.as('purchaseCount'),
          totalTokensSold: sql<number>`coalesce(sum(${tokenTransactions.amount}), 0)`.as('totalTokensSold'),
        })
        .from(tokenTransactions)
        .where(
          and(
            sql`${tokenTransactions.type} in ('purchase', 'auto_reload')`,
            sql`${tokenTransactions.description} LIKE ${'%' + pkg.name + '%'}`
          )
        );

      return {
        packageId: pkg.id,
        name: pkg.name,
        tokens: pkg.tokens,
        priceInCents: pkg.priceInCents,
        purchaseCount: stats?.purchaseCount ?? 0,
        totalTokensSold: stats?.totalTokensSold ?? 0,
        revenue: (stats?.purchaseCount ?? 0) * pkg.priceInCents,
      };
    })
  );

  return results.sort((a, b) => b.purchaseCount - a.purchaseCount);
}

/**
 * Get engagement metrics (auto-reload adoption, repeat purchases, active tenants)
 */
export async function getEngagementMetrics(useDemoData = false): Promise<EngagementMetrics> {
  if (useDemoData) {
    return generateDemoEngagementMetrics();
  }

  // Total tenants with wallets
  const [walletCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tokenWallets);

  const totalTenantsWithWallet = walletCount?.count ?? 0;

  if (totalTenantsWithWallet === 0) {
    return {
      autoReloadAdoptionRate: 0,
      repeatPurchaseRate: 0,
      activeTenantsRate: 0,
      totalTenantsWithWallet: 0,
    };
  }

  // Auto-reload adoption
  const [autoReloadCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(teams)
    .innerJoin(tokenWallets, eq(teams.id, tokenWallets.teamId))
    .where(eq(teams.autoReloadEnabled, true));

  // Repeat purchasers (more than 1 purchase)
  const [repeatPurchasers] = await db
    .select({
      count: sql<number>`count(*)`.as('count'),
    })
    .from(
      db
        .select({
          walletId: tokenTransactions.walletId,
          purchaseCount: sql<number>`count(*)`.as('purchaseCount'),
        })
        .from(tokenTransactions)
        .where(sql`${tokenTransactions.type} in ('purchase', 'auto_reload')`)
        .groupBy(tokenTransactions.walletId)
        .having(sql`count(*) > 1`)
        .as('subquery')
    );

  // Active tenants (consumed in last 7 days)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [activeCount] = await db
    .select({
      count: sql<number>`count(distinct ${tokenWallets.teamId})`.as('count'),
    })
    .from(tokenTransactions)
    .innerJoin(tokenWallets, eq(tokenTransactions.walletId, tokenWallets.id))
    .where(
      and(
        eq(tokenTransactions.type, 'consumption'),
        sql`${tokenTransactions.createdAt} >= ${oneWeekAgo}::timestamp`
      )
    );

  return {
    autoReloadAdoptionRate: Math.round(((autoReloadCount?.count ?? 0) / totalTenantsWithWallet) * 100),
    repeatPurchaseRate: Math.round(((repeatPurchasers?.count ?? 0) / totalTenantsWithWallet) * 100),
    activeTenantsRate: Math.round(((activeCount?.count ?? 0) / totalTenantsWithWallet) * 100),
    totalTenantsWithWallet,
  };
}

/**
 * Get recent activity feed from activity logs
 */
export async function getRecentActivityFeed(limit = 10, useDemoData = false): Promise<ActivityFeedItem[]> {
  if (useDemoData) {
    return generateDemoActivityFeed(limit);
  }

  const results = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      teamId: activityLogs.teamId,
      teamName: teams.name,
      userId: activityLogs.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(activityLogs)
    .leftJoin(teams, eq(activityLogs.teamId, teams.id))
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(sql`${activityLogs.timestamp} DESC`)
    .limit(limit);

  return results.map(r => ({
    id: r.id,
    action: r.action,
    timestamp: r.timestamp,
    teamName: r.teamName,
    teamId: r.teamId,
    userName: r.userName,
    userEmail: r.userEmail,
  }));
}

/**
 * Get activity distribution by day of week (last 30 days)
 */
export async function getActivityByDayOfWeek(useDemoData = false): Promise<DayOfWeekActivity[]> {
  if (useDemoData) {
    return generateDemoActivityByDayOfWeek();
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const results = await db
    .select({
      dayOfWeek: sql<number>`EXTRACT(DOW FROM ${activityLogs.timestamp})`.as('dayOfWeek'),
      activityCount: sql<number>`count(*)`.as('activityCount'),
    })
    .from(activityLogs)
    .where(sql`${activityLogs.timestamp} >= ${thirtyDaysAgo}::timestamp`)
    .groupBy(sql`EXTRACT(DOW FROM ${activityLogs.timestamp})`)
    .orderBy(sql`EXTRACT(DOW FROM ${activityLogs.timestamp}) ASC`);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Fill in missing days with 0
  const activityMap = new Map(results.map(r => [r.dayOfWeek, r.activityCount ?? 0]));

  return dayNames.map((dayName, index) => ({
    dayOfWeek: index,
    dayName,
    activityCount: activityMap.get(index) ?? 0,
  }));
}

/**
 * Get daily token flow (purchases vs consumption)
 */
export async function getDailyTokenFlow(days = 14, useDemoData = false): Promise<TokenFlowPoint[]> {
  if (useDemoData) {
    return generateDemoTokenFlow(days);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  const results = await db
    .select({
      date: sql<string>`DATE(${tokenTransactions.createdAt})`.as('date'),
      tokensIn: sql<number>`coalesce(sum(case when ${tokenTransactions.type} in ('purchase', 'auto_reload', 'bonus') then ${tokenTransactions.amount} else 0 end), 0)`.as('tokensIn'),
      tokensOut: sql<number>`coalesce(sum(case when ${tokenTransactions.type} = 'consumption' then abs(${tokenTransactions.amount}) else 0 end), 0)`.as('tokensOut'),
    })
    .from(tokenTransactions)
    .where(sql`${tokenTransactions.createdAt} >= ${startDateStr}::timestamp`)
    .groupBy(sql`DATE(${tokenTransactions.createdAt})`)
    .orderBy(sql`DATE(${tokenTransactions.createdAt}) ASC`);

  const data = results.map(r => ({
    date: r.date,
    tokensIn: r.tokensIn ?? 0,
    tokensOut: r.tokensOut ?? 0,
    netFlow: (r.tokensIn ?? 0) - (r.tokensOut ?? 0),
  }));

  return fillMissingDates(data, days, {
    tokensIn: 0,
    tokensOut: 0,
    netFlow: 0,
  });
}

/**
 * Get invitation statistics
 */
export async function getInvitationStats(useDemoData = false) {
  if (useDemoData) {
    return generateDemoInvitationStats();
  }

  // Note: This assumes there's an invitations table with status field
  // If invitations table doesn't exist or has different structure,
  // this will return demo data
  try {
    const results = await db
      .select({
        status: sql<string>`status`,
        count: sql<number>`count(*)`,
      })
      .from(sql`invitations`)
      .groupBy(sql`status`);

    let pending = 0;
    let accepted = 0;
    let expired = 0;

    results.forEach(r => {
      if (r.status === 'pending') pending = r.count ?? 0;
      else if (r.status === 'accepted') accepted = r.count ?? 0;
      else if (r.status === 'expired') expired = r.count ?? 0;
    });

    const total = pending + accepted + expired;

    return {
      pending,
      accepted,
      expired,
      conversionRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
    };
  } catch {
    return generateDemoInvitationStats();
  }
}
