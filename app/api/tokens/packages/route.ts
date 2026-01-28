import { NextResponse } from 'next/server';
import { getActivePackages } from '@/lib/tokens/service';

export async function GET() {
  try {
    const packages = await getActivePackages();

    return NextResponse.json({
      packages: packages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        tokens: pkg.tokens,
        priceInCents: pkg.priceInCents,
        stripePriceId: pkg.stripePriceId,
      })),
    });
  } catch (error) {
    console.error('Error fetching token packages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
