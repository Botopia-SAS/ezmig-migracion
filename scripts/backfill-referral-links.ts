/**
 * Backfill default referral links for all existing teams.
 * Creates one referral link per active form type for each team that doesn't already have them.
 * Safe to run multiple times (idempotent).
 *
 * Usage: npx tsx scripts/backfill-referral-links.ts
 */

import 'dotenv/config';
import { db } from '../lib/db/drizzle';
import { teams, teamMembers } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { createDefaultReferralLinks } from '../lib/referrals/service';

async function main() {
  console.log('Backfilling default referral links for all teams...\n');

  const allTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams);

  for (const team of allTeams) {
    // Find the owner to use as createdBy
    const [owner] = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, team.id))
      .limit(1);

    if (!owner) {
      console.log(`⚠ Skipping "${team.name}" (id: ${team.id}) — no members found`);
      continue;
    }

    const created = await createDefaultReferralLinks(team.id, owner.userId);

    if (created.length > 0) {
      console.log(`✓ Created ${created.length} referral links for "${team.name}" (id: ${team.id})`);
    } else {
      console.log(`- "${team.name}" (id: ${team.id}) — already has all links`);
    }
  }

  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
}).finally(() => {
  process.exit(0);
});
