# DentalLeadGenius Payment Setup Guide

This guide explains how to configure Stripe payments for your DentalLeadGenius platform.

## Pricing Packages

Your platform has three pricing tiers:

| Package | Setup Fee | Monthly Fee | Clinic Limit |
|---------|-----------|-------------|--------------|
| Essential | $1,997 | $497/month | 1 clinic |
| Growth | $2,997 | $997/month | 3 clinics |
| Elite | $4,997 | $1,497/month | Unlimited |

## Current Status: Test Mode

The platform is currently using **Stripe Test Mode**. This means:
- No real charges are made
- Use test card numbers for testing (see below)
- Customers are created in your Stripe test environment

### Test Card Numbers

Use these test cards in checkout:

| Card Type | Number | Expiry | CVC |
|-----------|--------|--------|-----|
| Success | 4242 4242 4242 4242 | Any future date | Any 3 digits |
| Decline | 4000 0000 0000 0002 | Any future date | Any 3 digits |
| 3D Secure | 4000 0027 6000 3184 | Any future date | Any 3 digits |

## Switching to Live Mode

When you're ready to accept real payments:

### Step 1: Connect Live Stripe Account

1. Go to the **Secrets** tab in Replit
2. You'll see the Stripe connection that was set up
3. The connection automatically handles both test and live modes
4. In production deployment, it will use live credentials

### Step 2: Verify Live Mode is Active

After deploying to production:
1. The system automatically uses production Stripe credentials
2. Test a small transaction with a real card
3. Check your Stripe Dashboard to confirm charges appear in live mode

### Step 3: Enable Webhooks (Automatic)

Webhooks are automatically configured by the integration:
- Webhook URL: `https://your-domain.replit.app/api/stripe/webhook/{uuid}`
- The UUID is generated automatically for security
- All Stripe events are synced to your database

## Changing Prices

To update pricing, modify the `/api/pricing` endpoint in `server/routes.ts`:

```typescript
// Find this section around line 1157
const packages = [
  {
    id: 'essential',
    name: 'Essential Package',
    setupFee: 1997,    // $1,997 (display value)
    monthlyFee: 497,   // $497 (display value)
    // ...
  },
  // ...
];
```

Also update the checkout session creation around line 1216 in the `/api/checkout/create-session` handler:

```typescript
const packages: Record<string, { setupFee: number; monthlyFee: number; name: string }> = {
  essential: { setupFee: 199700, monthlyFee: 49700, name: 'Essential Package' },  // cents
  growth: { setupFee: 299700, monthlyFee: 99700, name: 'Growth Package' },        // cents
  elite: { setupFee: 499700, monthlyFee: 149700, name: 'Elite Package' }          // cents
};
```

**Important:** 
- Display values are in dollars (e.g., 1997 = $1,997)
- Stripe amounts are in cents (e.g., 199700 = $1,997.00)

## Payment Flow

1. **Customer visits** `/pricing` page
2. **Selects a package** and enters clinic details
3. **Redirected to Stripe Checkout** for secure payment
4. **On successful payment:**
   - Customer record created in Stripe
   - Subscription started
   - User account created with temporary password
   - Clinic profile created
   - Redirected to `/payment/success` with credentials

## Customer Portal

Existing customers can manage their subscription:
- Access via the "Manage Subscription" button in their dashboard
- Opens Stripe Customer Portal
- Can update payment method, cancel, or change plan

## PayPal Integration (Future)

The codebase is prepared for PayPal integration:
- Payment method selection can be added to the checkout dialog
- Create a new endpoint `/api/checkout/paypal` for PayPal orders
- Use PayPal's JavaScript SDK on the frontend

To add PayPal:
1. Install PayPal SDK: `@paypal/paypal-js`
2. Add PayPal client ID to secrets
3. Create PayPal checkout endpoints
4. Update the checkout dialog with payment method tabs

## Troubleshooting

### Checkout not redirecting?
- Check browser console for errors
- Verify Stripe connection is active
- Check server logs for API errors

### Webhook not processing?
- Webhooks are auto-configured
- Check server logs for webhook errors
- Verify the webhook URL matches your domain

### Customer not created?
- Check Stripe Dashboard for the customer
- Verify email validation passed
- Check server logs for database errors

## Support

For technical issues:
- Check server logs in the Replit console
- Review Stripe Dashboard for payment logs
- Contact Stripe support for payment issues
