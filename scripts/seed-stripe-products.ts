/**
 * DentalLeadGenius Stripe Product Seeding Script
 * 
 * This script creates the three pricing packages in Stripe:
 * 1. Essential Package - $1,997 setup + $497/month
 * 2. Growth Package - $2,997 setup + $997/month  
 * 3. Elite Package - $4,997 setup + $1,497/month
 * 
 * Run with: npx tsx scripts/seed-stripe-products.ts
 */

import { getUncachableStripeClient } from '../server/stripeClient';

const PACKAGES = [
  {
    name: 'Essential Package',
    description: 'Perfect for solo practitioners. Includes AI chatbot, lead management, and basic outreach automation.',
    setupFee: 199700, // $1,997.00 in cents
    monthlyFee: 49700, // $497.00 in cents
    metadata: {
      tier: 'essential',
      features: 'ai_chatbot,lead_management,basic_outreach,1_clinic',
      clinicLimit: '1',
    }
  },
  {
    name: 'Growth Package', 
    description: 'For growing practices. Includes everything in Essential plus multi-channel outreach, sequences, and up to 3 clinics.',
    setupFee: 299700, // $2,997.00 in cents
    monthlyFee: 99700, // $997.00 in cents
    metadata: {
      tier: 'growth',
      features: 'ai_chatbot,lead_management,multi_channel_outreach,sequences,analytics,3_clinics',
      clinicLimit: '3',
    }
  },
  {
    name: 'Elite Package',
    description: 'For multi-location practices. Includes everything in Growth plus unlimited clinics, priority support, and custom branding.',
    setupFee: 499700, // $4,997.00 in cents
    monthlyFee: 149700, // $1,497.00 in cents
    metadata: {
      tier: 'elite',
      features: 'ai_chatbot,lead_management,multi_channel_outreach,sequences,analytics,unlimited_clinics,priority_support,custom_branding',
      clinicLimit: 'unlimited',
    }
  }
];

async function seedProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    console.log('Connected to Stripe');

    for (const pkg of PACKAGES) {
      // Check if product already exists
      const existingProducts = await stripe.products.search({
        query: `name:'${pkg.name}'`
      });

      if (existingProducts.data.length > 0) {
        console.log(`Product "${pkg.name}" already exists, skipping...`);
        continue;
      }

      // Create product
      console.log(`Creating product: ${pkg.name}`);
      const product = await stripe.products.create({
        name: pkg.name,
        description: pkg.description,
        metadata: pkg.metadata,
      });

      // Create setup fee price (one-time)
      console.log(`  Creating setup fee price: $${pkg.setupFee / 100}`);
      const setupPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: pkg.setupFee,
        currency: 'usd',
        metadata: {
          type: 'setup_fee',
          tier: pkg.metadata.tier,
        }
      });

      // Create monthly subscription price
      console.log(`  Creating monthly price: $${pkg.monthlyFee / 100}/month`);
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: pkg.monthlyFee,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          type: 'subscription',
          tier: pkg.metadata.tier,
        }
      });

      console.log(`  Product ID: ${product.id}`);
      console.log(`  Setup Price ID: ${setupPrice.id}`);
      console.log(`  Monthly Price ID: ${monthlyPrice.id}`);
      console.log('');
    }

    console.log('Done! Products created in Stripe.');
    console.log('Webhooks will automatically sync them to your database.');
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
