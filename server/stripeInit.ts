import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';

let stripeInitialized = false;

// Check if we're on Replit or external host
const isReplitEnvironment = !!process.env.REPL_ID;

export async function initStripe() {
  if (stripeInitialized) return;
  
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn('DATABASE_URL not set - Stripe initialization skipped');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ 
      databaseUrl,
      schema: 'stripe'
    } as any); // Type assertion for stripe-replit-sync compatibility
    console.log('Stripe schema ready');

    // Only do webhook setup and sync if we have Stripe configured
    let stripeSync;
    try {
      stripeSync = await getStripeSync();
    } catch (err) {
      console.log('Stripe not configured - skipping webhook and sync setup');
      stripeInitialized = true;
      return;
    }

    // Webhook setup only works on Replit with REPLIT_DOMAINS
    // On Render, webhooks should be configured manually in Stripe Dashboard
    if (isReplitEnvironment && process.env.REPLIT_DOMAINS) {
      console.log('Setting up managed webhook...');
      const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
      const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`,
        {
          enabled_events: ['*'],
          description: 'DentalLeadGenius payment webhook',
        }
      );
      console.log(`Webhook configured: ${webhook.url} (UUID: ${uuid})`);
    } else {
      console.log('Skipping managed webhook setup (not on Replit or no REPLIT_DOMAINS)');
      console.log('Configure Stripe webhooks manually in your Stripe Dashboard');
    }

    console.log('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => {
        console.log('Stripe data synced');
      })
      .catch((err: Error) => {
        console.error('Error syncing Stripe data:', err);
      });
      
    stripeInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    stripeInitialized = true; // Prevent repeated attempts
  }
}
