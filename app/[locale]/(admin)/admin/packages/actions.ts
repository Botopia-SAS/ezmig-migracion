"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { tokenPackages, type TokenPackage } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";
import { stripe } from "@/lib/payments/stripe";

async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: admin access required");
  }
  return user;
}

const createSchema = z.object({
  name: z.string().min(2).max(50),
  tokens: z.coerce.number().int().positive(),
  priceUsd: z.coerce.number().positive(),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  isActive: z.string().optional(),
});

const updateSchema = createSchema.extend({
  id: z.coerce.number().int().positive(),
});

function toCents(priceUsd: number) {
  return Math.round(priceUsd * 100);
}

function buildProductPayload(name: string, tokens: number) {
  return {
    name: `${name} Token Package`,
    description: `${tokens} tokens for form submissions`,
    metadata: {
      tokens: tokens.toString(),
      type: "token_package",
    },
  } as const;
}

export async function createPackageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Invalid data");
  }

  const { name, tokens, priceUsd, sortOrder, isActive } = parsed.data;
  const priceInCents = toCents(priceUsd);

  // Create product + price in Stripe
  const product = await stripe.products.create(buildProductPayload(name, tokens));
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: priceInCents,
    currency: "usd",
    metadata: { tokens: tokens.toString() },
  });

  await db.insert(tokenPackages).values({
    name,
    tokens,
    priceInCents,
    stripePriceId: price.id,
    stripeProductId: product.id,
    sortOrder,
    isActive: Boolean(isActive),
  });

  revalidatePath("/admin/packages");
}

async function getPackage(id: number): Promise<TokenPackage | null> {
  const [pkg] = await db.select().from(tokenPackages).where(eq(tokenPackages.id, id)).limit(1);
  return pkg || null;
}

export async function updatePackageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Invalid data");
  }

  const { id, name, tokens, priceUsd, sortOrder, isActive } = parsed.data;
  const priceInCents = toCents(priceUsd);

  const existing = await getPackage(id);
  if (!existing) {
    throw new Error("Package not found");
  }

  let stripeProductId = existing.stripeProductId;
  let stripePriceId = existing.stripePriceId;

  const productPayload = buildProductPayload(name, tokens);

  // Create or update product; create a new price when price/tokens change
  if (!stripeProductId) {
    const product = await stripe.products.create(productPayload);
    stripeProductId = product.id;
  } else {
    await stripe.products.update(stripeProductId, productPayload);
  }

  const priceChanged = priceInCents !== existing.priceInCents || tokens !== existing.tokens;
  if (priceChanged) {
    const price = await stripe.prices.create({
      product: stripeProductId!,
      unit_amount: priceInCents,
      currency: "usd",
      metadata: { tokens: tokens.toString() },
    });
    // Attempt to deactivate old price to avoid accidental sales
    if (stripePriceId && stripePriceId !== price.id) {
      try {
        await stripe.prices.update(stripePriceId, { active: false });
      } catch (err) {
        console.warn("Failed to deactivate old Stripe price", err);
      }
    }
    stripePriceId = price.id;
  }

  await db
    .update(tokenPackages)
    .set({
      name,
      tokens,
      priceInCents,
      sortOrder,
      isActive: Boolean(isActive),
      stripeProductId,
      stripePriceId,
    })
    .where(eq(tokenPackages.id, id));

  revalidatePath("/admin/packages");
}

export async function deactivatePackageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) {
    throw new Error("Invalid package id");
  }

  await db
    .update(tokenPackages)
    .set({ isActive: false })
    .where(eq(tokenPackages.id, id));

  revalidatePath("/admin/packages");
}
