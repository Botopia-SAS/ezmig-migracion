import 'dotenv/config';
import { db } from './drizzle';
import { users, teams, teamMembers } from './schema';
import { hashPassword } from '@/lib/auth/session';
import { createDefaultReferralLinks } from '@/lib/referrals/service';

async function seed() {
  // =========================================
  // 1. Crear usuario Admin del SaaS
  // =========================================
  const adminEmail = 'admin@ezmig.com';
  const adminPassword = 'admin123';
  const adminPasswordHash = await hashPassword(adminPassword);

  const [adminUser] = await db
    .insert(users)
    .values({
      email: adminEmail,
      name: 'Admin',
      passwordHash: adminPasswordHash,
      role: 'admin',
    })
    .returning();

  console.log(`Admin user created: ${adminEmail}`);

  // =========================================
  // 2. Crear usuario Attorney de prueba
  // =========================================
  const testEmail = 'test@test.com';
  const testPassword = 'admin123';
  const testPasswordHash = await hashPassword(testPassword);

  const [testUser] = await db
    .insert(users)
    .values({
      email: testEmail,
      name: 'Test Attorney',
      passwordHash: testPasswordHash,
      role: 'attorney',
    })
    .returning();

  console.log(`Test attorney created: ${testEmail}`);

  // =========================================
  // 3. Crear team (tenant) para el attorney
  // =========================================
  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Law Firm',
      type: 'law_firm',
    })
    .returning();

  console.log(`Team created: ${team.name}`);

  // =========================================
  // 4. Agregar attorney como owner del team
  // =========================================
  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: testUser.id,
    role: 'owner',
  });

  console.log(`Added ${testEmail} as owner of ${team.name}`);

  // =========================================
  // 5. Crear referral links por defecto
  // =========================================
  const defaultLinks = await createDefaultReferralLinks(team.id, testUser.id);
  console.log(`Created ${defaultLinks.length} default referral links for ${team.name}`);

  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  console.log('\nTest accounts:');
  console.log(`  Admin:    ${adminEmail} / ${adminPassword}`);
  console.log(`  Attorney: ${testEmail} / ${testPassword}`);
  console.log('========================================\n');
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
