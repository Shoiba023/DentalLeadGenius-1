# DentalLeadGenius

AI-powered lead generation platform for dental clinics. Automates outreach, manages leads through sales funnels, and provides intelligent chatbots for sales and patient interactions.

## Features

- Multi-clinic management with custom branding
- AI Sales Chatbot for demo bookings
- AI Patient Chatbot for appointment scheduling
- Lead scraping and management
- Email campaign automation (7-day nurture sequences)
- Stripe payment integration
- Analytics and reporting dashboard

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4
- **Payments**: Stripe
- **Email**: Resend

---

## Deploying to Render - Step by Step

### Prerequisites

1. A GitHub account with this repository
2. A Render account (https://render.com)
3. A PostgreSQL database (Render provides free tier)
4. OpenAI API key (https://platform.openai.com/api-keys)

### Step 1: Create PostgreSQL Database on Render

1. Go to Render Dashboard
2. Click **New** > **PostgreSQL**
3. Name: `dental-lead-genius-db`
4. Plan: Free (or paid for production)
5. Click **Create Database**
6. Wait for creation, then copy the **Internal Database URL**

### Step 2: Create Web Service on Render

1. Click **New** > **Web Service**
2. Connect your GitHub repository
3. Configure with these exact values:

| Setting | Value |
|---------|-------|
| **Name** | dental-lead-genius |
| **Runtime** | Node |
| **Branch** | main |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `npm run start` |

### Step 3: Set Environment Variables

In Render's **Environment** tab, add these variables:

#### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string from Step 1 |
| `SESSION_SECRET` | Random string (32+ chars) for session encryption |
| `OPENAI_API_KEY` | Your OpenAI API key (starts with `sk-`) |
| `NODE_ENV` | `production` |

#### Optional Variables (only if using these features)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key for payments |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `RESEND_API_KEY` | Resend API key for email sending |
| `RESEND_FROM_EMAIL` | Email address to send from |

### Step 4: Deploy

1. Click **Create Web Service**
2. Wait for build to complete (5-10 minutes)
3. Click the generated URL to view your app

### Step 5: Initialize Database

After first deployment, run database migrations:

```bash
# Option 1: Use Render Shell
npm run db:push

# Option 2: Connect locally with DATABASE_URL
DATABASE_URL="your-render-db-url" npm run db:push
```

---

## Environment Variables for Render

### Required

```env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-random-32-character-string-here
OPENAI_API_KEY=sk-your-openai-api-key
NODE_ENV=production
```

### Optional

```env
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Resend (for emails)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Automation (disabled by default for safety)
AUTOMATION_ENABLED=false
```

---

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The app runs at http://localhost:5000

---

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Type check
npm run check

# Database migrations
npm run db:push
```

---

## Project Structure

```
/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities
│   │   └── hooks/        # Custom hooks
├── server/           # Express backend
│   ├── routes.ts     # API routes
│   ├── storage.ts    # Database operations
│   ├── openai.ts     # AI integration
│   ├── email.ts      # Email service
│   └── stripeClient.ts # Stripe integration
├── shared/           # Shared types
│   └── schema.ts     # Database schema
└── package.json
```

---

## Authentication

The app supports two authentication methods:

1. **Email/Password** - Standard registration and login
2. **Replit Auth** - OAuth when running on Replit (auto-detected)

On Render, only email/password authentication is used.

---

## Troubleshooting

### Build fails with "vite: not found"

Make sure your build command includes dev dependencies:
```
npm install --include=dev && npm run build
```

### Database connection errors

1. Verify DATABASE_URL is correct
2. Check if database is running
3. Run `npm run db:push` to create tables

### OpenAI errors

1. Verify OPENAI_API_KEY is set
2. Check API key has credits
3. Verify key starts with `sk-`

### Authentication errors on Render

This is expected - Replit Auth only works on Replit.
Use email/password login on Render.

---

## Support

For issues, check the logs in Render dashboard or run locally to debug.
