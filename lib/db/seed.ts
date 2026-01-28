import 'dotenv/config';
import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers, tokenWallets, tokenPackages } from './schema';
import { hashPassword } from '@/lib/auth/session';

// Definición de paquetes de tokens
const TOKEN_PACKAGES = [
  { name: 'Starter', tokens: 5, priceInCents: 1500, sortOrder: 1 },
  { name: 'Basic', tokens: 10, priceInCents: 2900, sortOrder: 2 },
  { name: 'Standard', tokens: 25, priceInCents: 6900, sortOrder: 3 },
  { name: 'Pro', tokens: 50, priceInCents: 12900, sortOrder: 4 },
  { name: 'Enterprise', tokens: 100, priceInCents: 24900, sortOrder: 5 },
];

async function createTokenPackages() {
  console.log('Creating token packages in Stripe...');

  for (const pkg of TOKEN_PACKAGES) {
    // Crear producto en Stripe
    const product = await stripe.products.create({
      name: `${pkg.name} Token Package`,
      description: `${pkg.tokens} tokens for form submissions`,
      metadata: {
        tokens: pkg.tokens.toString(),
        type: 'token_package',
      },
    });

    // Crear precio (one-time, no recurring)
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pkg.priceInCents,
      currency: 'usd',
      metadata: {
        tokens: pkg.tokens.toString(),
      },
    });

    // Guardar en base de datos
    await db.insert(tokenPackages).values({
      name: pkg.name,
      tokens: pkg.tokens,
      priceInCents: pkg.priceInCents,
      stripePriceId: price.id,
      stripeProductId: product.id,
      isActive: true,
      sortOrder: pkg.sortOrder,
    });

    console.log(`  Created package: ${pkg.name} (${pkg.tokens} tokens) - $${pkg.priceInCents / 100}`);
  }

  console.log('Token packages created successfully.');
}

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
  // 5. Crear wallet para el team
  // =========================================
  await db.insert(tokenWallets).values({
    teamId: team.id,
    balance: 0,
  });

  console.log(`Wallet created for ${team.name} (balance: 0)`);

  // =========================================
  // 6. Crear paquetes de tokens en Stripe
  // =========================================
  await createTokenPackages();

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
