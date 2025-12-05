/**
 * STRIPE PRODUCTS & PAYMENT LINKS
 * ================================
 * 
 * LIVE MODE CONFIGURATION for DentalLeadGenius
 * 
 * Products:
 * - Starter: $497/mo (monthly subscription)
 * - Pro: $297/mo (monthly subscription)  
 * - Elite: $2,497 - $4,997 (lifetime one-time payment)
 */

import { getUncachableStripeClient } from "./stripeClient";

// ============================================================================
// PRODUCT DEFINITIONS
// ============================================================================

export const PRODUCTS = {
  STARTER: {
    id: "starter",
    name: "DentalLeadGenius Starter",
    description: "AI-powered lead generation for growing dental practices",
    priceMonthly: 49700, // $497.00 in cents
    priceLifetime: 297000, // $2,970.00 in cents (6 months value)
    features: [
      "AI Receptionist (24/7)",
      "Up to 500 leads/month",
      "Email + SMS outreach",
      "Basic reporting",
      "Email support"
    ]
  },
  PRO: {
    id: "pro",
    name: "DentalLeadGenius Pro",
    description: "Full automation suite for established dental practices",
    priceMonthly: 29700, // $297.00 in cents
    priceLifetime: 178200, // $1,782.00 in cents (6 months value)
    features: [
      "Everything in Starter",
      "Unlimited leads",
      "Multi-channel campaigns",
      "Advanced analytics",
      "Priority support",
      "Custom integrations"
    ]
  },
  ELITE_STANDARD: {
    id: "elite-standard",
    name: "DentalLeadGenius Elite",
    description: "Full-featured tier with premium support",
    priceMonthly: 99700, // $997.00 in cents
    priceLifetime: 249700, // $2,497.00 in cents
    features: [
      "Lifetime access",
      "Everything in Pro",
      "White-label branding",
      "Dedicated success manager",
      "Custom AI training",
      "API access"
    ]
  },
  ELITE_PREMIUM: {
    id: "elite-premium",
    name: "DentalLeadGenius Elite Premium",
    description: "Ultimate tier with done-for-you setup",
    priceMonthly: 149700, // $1,497.00 in cents
    priceLifetime: 499700, // $4,997.00 in cents
    features: [
      "Everything in Elite Standard",
      "Multi-location support",
      "Enterprise integrations",
      "Done-for-you setup",
      "Quarterly strategy calls",
      "Custom development hours"
    ]
  }
};

// ============================================================================
// PAYMENT LINK STORAGE
// ============================================================================

interface PaymentLinks {
  // Starter Plan
  starterMonthly: string | null;
  starterLifetime: string | null;
  // Pro Plan
  proMonthly: string | null;
  proLifetime: string | null;
  // Elite Standard
  eliteStandardMonthly: string | null;
  eliteStandardLifetime: string | null;
  // Elite Premium
  elitePremiumMonthly: string | null;
  elitePremiumLifetime: string | null;
  // Legacy fields for backward compatibility
  starter: string | null;
  pro: string | null;
  eliteStandard: string | null;
  elitePremium: string | null;
  createdAt: Date | null;
}

let paymentLinks: PaymentLinks = {
  starterMonthly: null,
  starterLifetime: null,
  proMonthly: null,
  proLifetime: null,
  eliteStandardMonthly: null,
  eliteStandardLifetime: null,
  elitePremiumMonthly: null,
  elitePremiumLifetime: null,
  starter: null,
  pro: null,
  eliteStandard: null,
  elitePremium: null,
  createdAt: null
};

// ============================================================================
// STRIPE PRODUCT CREATION
// ============================================================================

interface ProductConfig {
  id: string;
  name: string;
  description: string;
  priceMonthly?: number;
  priceOneTime?: number;
  features: string[];
}

async function createOrGetProduct(stripe: any, productConfig: ProductConfig): Promise<string> {
  try {
    // Search for existing product
    const existingProducts = await stripe.products.search({
      query: `metadata["product_id"]:"${productConfig.id}"`,
      limit: 1
    });

    if (existingProducts.data.length > 0) {
      console.log(`[STRIPE] Found existing product: ${productConfig.name}`);
      return existingProducts.data[0].id;
    }

    // Create new product
    const product = await stripe.products.create({
      name: productConfig.name,
      description: productConfig.description,
      metadata: {
        product_id: productConfig.id,
        source: "dentalleadgenius"
      }
    });

    console.log(`[STRIPE] Created product: ${productConfig.name} (${product.id})`);
    return product.id;
  } catch (error) {
    console.error(`[STRIPE] Error creating product ${productConfig.name}:`, error);
    throw error;
  }
}

async function createOrGetPrice(
  stripe: any, 
  productId: string, 
  amountCents: number, 
  isRecurring: boolean,
  productKey: string
): Promise<string> {
  try {
    // Search for existing price
    const existingPrices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 10
    });

    const matchingPrice = existingPrices.data.find((p: any) => 
      p.unit_amount === amountCents && 
      (isRecurring ? p.recurring?.interval === 'month' : !p.recurring)
    );

    if (matchingPrice) {
      console.log(`[STRIPE] Found existing price: $${amountCents / 100}`);
      return matchingPrice.id;
    }

    // Create new price
    const priceConfig: any = {
      product: productId,
      unit_amount: amountCents,
      currency: 'usd',
      metadata: {
        product_key: productKey,
        source: "dentalleadgenius"
      }
    };

    if (isRecurring) {
      priceConfig.recurring = { interval: 'month' };
    }

    const price = await stripe.prices.create(priceConfig);
    console.log(`[STRIPE] Created price: $${amountCents / 100} (${price.id})`);
    return price.id;
  } catch (error) {
    console.error(`[STRIPE] Error creating price:`, error);
    throw error;
  }
}

async function createPaymentLink(
  stripe: any,
  priceId: string,
  productName: string
): Promise<string> {
  try {
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: priceId, quantity: 1 }],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/onboarding?success=true&product=${encodeURIComponent(productName)}`
        }
      },
      metadata: {
        product: productName,
        source: "dentalleadgenius"
      }
    });

    console.log(`[STRIPE] Created payment link for ${productName}: ${paymentLink.url}`);
    return paymentLink.url;
  } catch (error) {
    console.error(`[STRIPE] Error creating payment link:`, error);
    throw error;
  }
}

// ============================================================================
// MAIN INITIALIZATION FUNCTION
// ============================================================================

export async function initializeStripeProducts(): Promise<PaymentLinks> {
  console.log("[STRIPE] Initializing products and payment links (TEST MODE)...");
  
  try {
    const stripe = await getUncachableStripeClient();

    // =========================================================================
    // STARTER PLAN - Monthly + Lifetime
    // =========================================================================
    const starterProductId = await createOrGetProduct(stripe, PRODUCTS.STARTER);
    
    // Starter Monthly ($497/mo)
    const starterMonthlyPriceId = await createOrGetPrice(
      stripe, starterProductId, PRODUCTS.STARTER.priceMonthly, true, 'starter-monthly'
    );
    paymentLinks.starterMonthly = await createPaymentLink(stripe, starterMonthlyPriceId, "Starter Monthly ($497/mo)");
    paymentLinks.starter = paymentLinks.starterMonthly; // Legacy

    // Starter Lifetime ($2,970)
    const starterLifetimePriceId = await createOrGetPrice(
      stripe, starterProductId, PRODUCTS.STARTER.priceLifetime, false, 'starter-lifetime'
    );
    paymentLinks.starterLifetime = await createPaymentLink(stripe, starterLifetimePriceId, "Starter Lifetime ($2,970)");

    // =========================================================================
    // PRO PLAN - Monthly + Lifetime
    // =========================================================================
    const proProductId = await createOrGetProduct(stripe, PRODUCTS.PRO);
    
    // Pro Monthly ($297/mo)
    const proMonthlyPriceId = await createOrGetPrice(
      stripe, proProductId, PRODUCTS.PRO.priceMonthly, true, 'pro-monthly'
    );
    paymentLinks.proMonthly = await createPaymentLink(stripe, proMonthlyPriceId, "Pro Monthly ($297/mo)");
    paymentLinks.pro = paymentLinks.proMonthly; // Legacy

    // Pro Lifetime ($1,782)
    const proLifetimePriceId = await createOrGetPrice(
      stripe, proProductId, PRODUCTS.PRO.priceLifetime, false, 'pro-lifetime'
    );
    paymentLinks.proLifetime = await createPaymentLink(stripe, proLifetimePriceId, "Pro Lifetime ($1,782)");

    // =========================================================================
    // ELITE STANDARD - Monthly + Lifetime
    // =========================================================================
    const eliteStdProductId = await createOrGetProduct(stripe, PRODUCTS.ELITE_STANDARD);
    
    // Elite Standard Monthly ($997/mo)
    const eliteStdMonthlyPriceId = await createOrGetPrice(
      stripe, eliteStdProductId, PRODUCTS.ELITE_STANDARD.priceMonthly, true, 'elite-standard-monthly'
    );
    paymentLinks.eliteStandardMonthly = await createPaymentLink(stripe, eliteStdMonthlyPriceId, "Elite Monthly ($997/mo)");

    // Elite Standard Lifetime ($2,497)
    const eliteStdLifetimePriceId = await createOrGetPrice(
      stripe, eliteStdProductId, PRODUCTS.ELITE_STANDARD.priceLifetime, false, 'elite-standard-lifetime'
    );
    paymentLinks.eliteStandardLifetime = await createPaymentLink(stripe, eliteStdLifetimePriceId, "Elite Lifetime ($2,497)");
    paymentLinks.eliteStandard = paymentLinks.eliteStandardLifetime; // Legacy

    // =========================================================================
    // ELITE PREMIUM - Monthly + Lifetime
    // =========================================================================
    const elitePremProductId = await createOrGetProduct(stripe, PRODUCTS.ELITE_PREMIUM);
    
    // Elite Premium Monthly ($1,497/mo)
    const elitePremMonthlyPriceId = await createOrGetPrice(
      stripe, elitePremProductId, PRODUCTS.ELITE_PREMIUM.priceMonthly, true, 'elite-premium-monthly'
    );
    paymentLinks.elitePremiumMonthly = await createPaymentLink(stripe, elitePremMonthlyPriceId, "Elite Premium Monthly ($1,497/mo)");

    // Elite Premium Lifetime ($4,997)
    const elitePremLifetimePriceId = await createOrGetPrice(
      stripe, elitePremProductId, PRODUCTS.ELITE_PREMIUM.priceLifetime, false, 'elite-premium-lifetime'
    );
    paymentLinks.elitePremiumLifetime = await createPaymentLink(stripe, elitePremLifetimePriceId, "Elite Premium Lifetime ($4,997)");
    paymentLinks.elitePremium = paymentLinks.elitePremiumLifetime; // Legacy

    paymentLinks.createdAt = new Date();

    console.log("[STRIPE] ═══════════════════════════════════════════════════════════");
    console.log("[STRIPE]         ALL PAYMENT LINKS READY (TEST MODE)               ");
    console.log("[STRIPE] ═══════════════════════════════════════════════════════════");
    console.log("[STRIPE] ");
    console.log("[STRIPE] STARTER PLAN:");
    console.log(`[STRIPE]   Monthly ($497/mo):    ${paymentLinks.starterMonthly}`);
    console.log(`[STRIPE]   Lifetime ($2,970):    ${paymentLinks.starterLifetime}`);
    console.log("[STRIPE] ");
    console.log("[STRIPE] PRO PLAN:");
    console.log(`[STRIPE]   Monthly ($297/mo):    ${paymentLinks.proMonthly}`);
    console.log(`[STRIPE]   Lifetime ($1,782):    ${paymentLinks.proLifetime}`);
    console.log("[STRIPE] ");
    console.log("[STRIPE] ELITE STANDARD:");
    console.log(`[STRIPE]   Monthly ($997/mo):    ${paymentLinks.eliteStandardMonthly}`);
    console.log(`[STRIPE]   Lifetime ($2,497):    ${paymentLinks.eliteStandardLifetime}`);
    console.log("[STRIPE] ");
    console.log("[STRIPE] ELITE PREMIUM:");
    console.log(`[STRIPE]   Monthly ($1,497/mo):  ${paymentLinks.elitePremiumMonthly}`);
    console.log(`[STRIPE]   Lifetime ($4,997):    ${paymentLinks.elitePremiumLifetime}`);
    console.log("[STRIPE] ═══════════════════════════════════════════════════════════");

    return paymentLinks;
  } catch (error) {
    console.error("[STRIPE] Failed to initialize products:", error);
    throw error;
  }
}

export function getPaymentLinks(): PaymentLinks {
  return paymentLinks;
}

export function getPaymentLinkForPlan(plan: 'starter' | 'pro' | 'elite-standard' | 'elite-premium'): string | null {
  switch (plan) {
    case 'starter': return paymentLinks.starter;
    case 'pro': return paymentLinks.pro;
    case 'elite-standard': return paymentLinks.eliteStandard;
    case 'elite-premium': return paymentLinks.elitePremium;
    default: return null;
  }
}
