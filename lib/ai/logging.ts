import { db } from '@/lib/db/drizzle';
import { aiLogs } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface AIInteractionLog {
  userId: number;
  teamId: number;
  caseId?: number;
  caseFormId?: number;
  prompt: string;
  response: string;
  tokensUsed: number;
  model: string;
  latencyMs: number;
  actionType?: 'form_fill' | 'translation' | 'review' | 'question' | 'chat';
  context?: Record<string, unknown>;
}

/**
 * Log an AI interaction
 */
export async function logAIInteraction(log: AIInteractionLog) {
  const [inserted] = await db
    .insert(aiLogs)
    .values({
      userId: log.userId,
      teamId: log.teamId,
      caseId: log.caseId,
      caseFormId: log.caseFormId,
      prompt: log.prompt,
      response: log.response,
      tokensUsed: log.tokensUsed,
      model: log.model,
      responseTimeMs: log.latencyMs,
      actionType: log.actionType || 'chat',
      context: log.context,
    })
    .returning();

  return inserted;
}

/**
 * Get AI interaction logs for a user
 */
export async function getLogsForUser(userId: number, limit = 50) {
  return db
    .select()
    .from(aiLogs)
    .where(eq(aiLogs.userId, userId))
    .orderBy(desc(aiLogs.createdAt))
    .limit(limit);
}

/**
 * Get AI interaction logs for a team
 */
export async function getLogsForTeam(teamId: number, limit = 100) {
  return db
    .select()
    .from(aiLogs)
    .where(eq(aiLogs.teamId, teamId))
    .orderBy(desc(aiLogs.createdAt))
    .limit(limit);
}

/**
 * Get AI interaction logs for a case
 */
export async function getLogsForCase(caseId: number, limit = 50) {
  return db
    .select()
    .from(aiLogs)
    .where(eq(aiLogs.caseId, caseId))
    .orderBy(desc(aiLogs.createdAt))
    .limit(limit);
}

/**
 * Get total tokens used by a team in a time period
 */
export async function getTokenUsageForTeam(
  teamId: number,
  startDate: Date,
  endDate: Date
) {
  const result = await db
    .select({
      totalTokens: sql<number>`COALESCE(SUM(${aiLogs.tokensUsed}), 0)::int`,
      totalInteractions: sql<number>`COUNT(*)::int`,
    })
    .from(aiLogs)
    .where(
      and(
        eq(aiLogs.teamId, teamId),
        sql`${aiLogs.createdAt} >= ${startDate}`,
        sql`${aiLogs.createdAt} <= ${endDate}`
      )
    );

  return result[0] || { totalTokens: 0, totalInteractions: 0 };
}

/**
 * Get daily AI usage stats for a team
 */
export async function getDailyUsageStats(teamId: number, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return db
    .select({
      date: sql<string>`DATE(${aiLogs.createdAt})`.as('date'),
      totalTokens: sql<number>`COALESCE(SUM(${aiLogs.tokensUsed}), 0)::int`.as('totalTokens'),
      interactions: sql<number>`COUNT(*)::int`.as('interactions'),
    })
    .from(aiLogs)
    .where(
      and(
        eq(aiLogs.teamId, teamId),
        sql`${aiLogs.createdAt} >= ${startDate}`
      )
    )
    .groupBy(sql`DATE(${aiLogs.createdAt})`)
    .orderBy(sql`DATE(${aiLogs.createdAt}) ASC`);
}
