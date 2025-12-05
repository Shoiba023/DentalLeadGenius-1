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
    description: "Lifetime access - Standard tier",
    priceOneTime: 249700, // $2,497.00 in cents
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
    description: "Lifetime access - Premium tier with extra features",
    priceOneTime: 499700, // $4,997.00 in cents
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
  starter: string | null;
  pro: string | null;
  eliteStandard: string | null;
  elitePremium: string | null;
  createdAt: Date | null;
}

let paymentLinks: PaymentLinks = {
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
  console.log("[STRIPE] Initializing LIVE products and payment links...");
  
  try {
    const stripe = await getUncachableStripeClient();

    // Create/get Starter product and price
    const starterProductId = await createOrGetProduct(stripe, PRODUCTS.STARTER);
    const starterPriceId = await createOrGetPrice(
      stripe, 
      starterProductId, 
      PRODUCTS.STARTER.priceMonthly, 
      true,
      'starter'
    );
    paymentLinks.starter = await createPaymentLink(stripe, starterPriceId, "Starter ($497/mo)");

    // Create/get Pro product and price
    const proProductId = await createOrGetProduct(stripe, PRODUCTS.PRO);
    const proPriceId = await createOrGetPrice(
      stripe, 
      proProductId, 
      PRODUCTS.PRO.priceMonthly, 
      true,
      'pro'
    );
    paymentLinks.pro = await createPaymentLink(stripe, proPriceId, "Pro ($297/mo)");

    // Create/get Elite Standard product and price
    const eliteStdProductId = await createOrGetProduct(stripe, PRODUCTS.ELITE_STANDARD);
    const eliteStdPriceId = await createOrGetPrice(
      stripe, 
      eliteStdProductId, 
      PRODUCTS.ELITE_STANDARD.priceOneTime, 
      false,
      'elite-standard'
    );
    paymentLinks.eliteStandard = await createPaymentLink(stripe, eliteStdPriceId, "Elite Standard ($2,497)");

    // Create/get Elite Premium product and price
    const elitePremProductId = await createOrGetProduct(stripe, PRODUCTS.ELITE_PREMIUM);
    const elitePremPriceId = await createOrGetPrice(
      stripe, 
      elitePremProductId, 
      PRODUCTS.ELITE_PREMIUM.priceOneTime, 
      false,
      'elite-premium'
    );
    paymentLinks.elitePremium = await createPaymentLink(stripe, elitePremPriceId, "Elite Premium ($4,997)");

    paymentLinks.createdAt = new Date();

    console.log("[STRIPE] ═══════════════════════════════════════════════════════════");
    console.log("[STRIPE]              LIVE PAYMENT LINKS READY                      ");
    console.log("[STRIPE] ═══════════════════════════════════════════════════════════");
    console.log(`[STRIPE] Starter ($497/mo):       ${paymentLinks.starter}`);
    console.log(`[STRIPE] Pro ($297/mo):           ${paymentLinks.pro}`);
    console.log(`[STRIPE] Elite ($2,497):          ${paymentLinks.eliteStandard}`);
    console.log(`[STRIPE] Elite Premium ($4,997):  ${paymentLinks.elitePremium}`);
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
