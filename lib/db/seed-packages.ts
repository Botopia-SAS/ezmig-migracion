import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { tokenPackages } from './schema';
import { eq } from 'drizzle-orm';

// Definición de paquetes de tokens
const TOKEN_PACKAGES = [
  { name: 'Starter', tokens: 5, priceInCents: 1500, sortOrder: 1 },
  { name: 'Basic', tokens: 10, priceInCents: 2900, sortOrder: 2 },
  { name: 'Standard', tokens: 25, priceInCents: 6900, sortOrder: 3 },
  { name: 'Pro', tokens: 50, priceInCents: 12900, sortOrder: 4 },
  { name: 'Enterprise', tokens: 100, priceInCents: 24900, sortOrder: 5 },
];

async function seedTokenPackages() {
  console.log('Checking existing token packages...');

  // Verificar si ya existen paquetes
  const existingPackages = await db.select().from(tokenPackages);

  if (existingPackages.length > 0) {
    console.log(`Found ${existingPackages.length} existing packages. Skipping...`);
    console.log('Existing packages:', existingPackages.map((p) => p.name).join(', '));
    return;
  }

  console.log('Creating token packages in Stripe and database...');

  for (const pkg of TOKEN_PACKAGES) {
    try {
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
        isActive: true,
        sortOrder: pkg.sortOrder,
      });

      console.log(`  ✓ Created: ${pkg.name} (${pkg.tokens} tokens) - $${pkg.priceInCents / 100}`);
    } catch (error) {
      console.error(`  ✗ Failed to create ${pkg.name}:`, error);
    }
  }

  console.log('\nToken packages seeded successfully!');
}

seedTokenPackages()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
