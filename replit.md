# DentalLeadGenius

## Overview

DentalLeadGenius is an AI-powered lead generation platform for dental clinics, automating outreach, managing leads through sales funnels, and providing intelligent chatbots for sales and patient interactions. It supports multi-clinic management with custom branding and offers instant demo delivery. The platform aims to enhance lead conversion and streamline patient engagement for dental practices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

**Framework**: React with TypeScript, using Vite.

**UI Component System**: shadcn/ui (New York style) built on Radix UI primitives with Tailwind CSS. It features a clean B2B SaaS aesthetic for marketing/patient areas and Tailwind UI conventions for the admin dashboard. Typography uses Inter and Cal Sans/Lexend.

**Routing**: Wouter for client-side routing, separating public routes (landing, clinic pages) from authenticated admin routes (Analytics, Leads, Outreach, Clinics).

**State Management**: TanStack Query for server state, with authentication managed via an `/api/auth/session` endpoint.

**Key Design Patterns**: Component composition with Radix UI, custom hooks, React Hook Form with Zod validation, and responsive mobile-first design.

### Backend

**Framework**: Express.js with TypeScript (ESM modules).

**Server Structure**: Vite middleware for development, serves static assets in production.

**API Design**: RESTful API with grouped resources (e.g., `/api/leads`, `/api/clinics`).

**Authentication**: Custom email/password authentication using bcrypt for hashing, with session data stored in PostgreSQL (7-day expiration). Role-based access (admin/clinic) is implemented.

**AI Integration**: Utilizes OpenAI API for sales chatbot conversations, patient chatbots, and outreach message generation.

### Campaign Hub (Outreach Manager)

**Multi-Channel Support**: The Campaign Hub supports both traditional outreach (Email, SMS, WhatsApp) and social media campaigns (Facebook Post, Instagram Post, YouTube Community Post, TikTok Caption).

**Social Campaign Fields**: 
- `targetUrl`: Landing page URL for the campaign
- `mediaUrl`: Image/video URL to use in posts
- `hashtags`: Comma-separated hashtags for social posts
- `status`: Campaign status (draft, ready, active, paused, completed, archived)

**Copy/Export Workflow**: Social campaigns include platform-specific copy buttons that format content with hashtags and links for manual posting. Auto-posting via official APIs is planned for future implementation.

**API Endpoints**:
- `GET /api/campaigns` - List campaigns for current clinic
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/:id` - Get campaign by ID
- `PUT /api/campaigns/:id` - Update campaign (clinic-scoped for security)

### Chatbot Flow

The platform features two types of AI chatbots: a **Sales Chatbot** on the homepage for demo bookings and a **Patient Chatbot** on clinic pages for appointment bookings. Both interact with the backend to save messages, fetch conversation history, and generate AI responses using GPT-4o with specialized system prompts.

### Data Storage Solutions

**Database**: PostgreSQL via Neon serverless driver.

**ORM**: Drizzle ORM for type-safe operations.

**Schema Design**: Includes tables for `users`, `sessions`, `leads`, `clinics`, `clinic_users`, `bookings`, `chatbot_threads`, `chatbot_messages`, `outreach_campaigns`, and `patient_bookings`.

**Data Access Layer**: An `IStorage` interface in `server/storage.ts` abstracts database operations.

### Authentication and Authorization

**Primary Method**: Custom email/password authentication with bcrypt.

**Session Management**: PostgreSQL-backed sessions (7-day TTL) using HTTP-only, secure cookies with clinic context tracking.

**Authorization Strategy**: `isAuthenticated` middleware protects routes. Public routes are accessible without authentication. User roles are supported via an `isAdmin` flag.

### Multi-Tenant Isolation

**Clinic Context**: Each authenticated session tracks a `selectedClinicId` representing the active clinic context.

**Data Isolation Pattern**: 
- All clinic-scoped resources (leads, sequences, campaigns, bookings, analytics) include a `clinicId` foreign key
- Platform-level demo leads are allowed with NULL clinicId for sales funnel tracking
- The `requireClinicContext()` helper validates authentication and clinic membership before granting access
- Clinic-scoped storage helpers (`getLeadsByClinic`, `getSequencesByClinic`, `getBookingsByClinic`, etc.) enforce SQL-level tenant isolation

**Clinic Switcher**: Users with access to multiple clinics can switch between them using the ClinicSwitcher component in the sidebar.

**Security Model**:
- Routes validate clinic membership via `clinic_users` table before granting access
- Database-level foreign keys ensure referential integrity
- Global storage methods are deprecated in favor of clinic-scoped alternatives

### Site Configuration

**Centralized Config**: Brand identity and contact details are stored in `shared/config.ts`:
- `SITE_NAME`: "DentalLeadGenius"
- `SITE_URL`: "https://dentalleadgenius.com"
- `SUPPORT_EMAIL`: "support@dentalleadgenius.com"
- `SITE_TAGLINE`: "AI-Powered Lead Generation for Dental Clinics"

This config is imported by both frontend and backend to ensure consistent branding.

### Email Infrastructure

**Provider**: Resend (via Replit connector integration)

**Email Service** (`server/email.ts`):
- `sendEmail()`: Generic email sending via Resend API
- `sendSupportEmail()`: Sends notifications to support@dentalleadgenius.com
- `sendLeadNotificationEmail()`: Sends formatted lead capture notifications
- `sendDemoLinkEmail()`: Sends demo access links to users
- `testEmailConnection()`: Verifies Resend connectivity
- `isEmailConfigured()`: Checks if Resend integration is configured

**Integration**: Uses Replit's built-in Resend connector which automatically manages API keys and authentication. No manual environment variables required.

**Health Check Endpoints**:
- `GET /health/email`: Checks Resend configuration and connection
- `POST /health/email`: Sends a test email (optional `to` field in body)

**Lead Notifications**: The following forms send email notifications to support:
- Demo request form (`/api/demo-request`)
- Demo booking form (`/api/bookings`)
- Email-gated demo request (`/api/send-demo-link`)
- Patient appointment requests (`/api/patient-bookings`)

### Lead Segmentation Service

**Service File**: `server/leadSegmentation.ts`

**Purpose**: Provides helper functions for managing lead statuses, sources, and tags consistently across the application.

**Key Functions**:
- `markContacted(leadId)`: Mark a lead as contacted (first outreach sent)
- `markWarm(leadId)`: Mark a lead as warm (showed interest)
- `markConverted(leadId)`: Mark a lead as won/converted
- `addTag(leadId, tag)`: Add a tag to a lead
- `removeTag(leadId, tag)`: Remove a tag from a lead
- `getSegmentationSummary(clinicId)`: Get breakdown by status, source, and tags

**Lead Statuses**: new, contacted, warm, replied, demo_booked, won, lost

**API Endpoints**:
- `PATCH /api/leads/:id/status`: Update lead status
- `POST /api/leads/:id/tags`: Add tag to lead
- `DELETE /api/leads/:id/tags/:tag`: Remove tag from lead
- `GET /api/segmentation/:clinicId`: Get segmentation summary

### Nurture Campaign Service

**Service File**: `server/nurtureCampaign.ts`

**Purpose**: Automated 3-step follow-up sequences for new leads.

**Sequence Schedule**:
- Day 0: Welcome & Introduction email
- Day 2: Value Proposition & Features email
- Day 5: Final CTA with Demo Offer email

**Key Functions**:
- `runClinicNurtureCampaign(clinicId)`: Process all eligible leads
- `getNurtureStatus(leadId)`: Get current nurture status for a lead
- `processLeadNurture(lead, clinic)`: Send next nurture step for a single lead

**Tracking Tags**:
- `nurture_step_1_sent`, `nurture_step_2_sent`, `nurture_step_3_sent`
- `nurture_complete` (when all 3 steps finished)

**API Endpoints**:
- `POST /api/nurture/run/:clinicId`: Run nurture campaign for a clinic
- `GET /api/nurture/status/:leadId`: Get nurture status for a lead
- `POST /api/nurture/campaigns`: Create a new nurture campaign

### Booking Tracking Service

**Service File**: `server/bookingTracking.ts`

**Purpose**: Campaign attribution and lead conversion tracking for patient bookings.

**Booking Sources**: direct, email, sms, chatbot, website, referral

**Schema Fields** (in `patient_bookings`):
- `campaignId`: Links booking to the campaign that drove it
- `leadId`: Links booking to the lead that converted
- `source`: How the patient found us

**Key Functions**:
- `processNewBooking(bookingData, referrer)`: Create booking with automatic attribution
- `getClinicBookingAnalytics(clinicId)`: Get booking stats for a clinic
- `getCampaignConversionStats(campaignId)`: Get conversion metrics for a campaign

**API Endpoints**:
- `GET /api/analytics/bookings/:clinicId`: Get booking analytics
- `GET /api/analytics/campaign/:campaignId/conversions`: Get campaign conversion stats

### External API (Lead Import)

Production-grade API for syncing leads from external tools like DentalMapsHelper. Features idempotent imports with automatic deduplication.

**Full Documentation**: See `docs/import-api.md` for complete API reference.

**Authentication**: Bearer token using `IMPORT_API_KEY` environment variable.

**Endpoints**:

1. `POST /api/external/leads/import` - Import a single lead with deduplication
   - Headers: `Authorization: Bearer <IMPORT_API_KEY>`
   - Body: `{ name, email?, phone?, address?, city?, state?, country?, googleMapsUrl?, websiteUrl?, source?, marketingOptIn?, tags?, clinicId?, notes?, status? }`
   - Response: `{ success: true, leadId: "<uuid>", existing: false }`

2. `POST /api/external/leads/bulk-import` - Import multiple leads (per-lead error handling)
   - Headers: `Authorization: Bearer <IMPORT_API_KEY>`
   - Body: `{ leads: [...] }`
   - Response: `{ success: true, totalProcessed: N, created: N, existing: N, failed: N, results: [...] }`

3. `GET /api/admin/leads/import-stats` - Admin statistics (session auth required)
   - Returns: `{ totalLeads, totalMapsHelperLeads, lastImportedAt, importedTodayCount }`

**Deduplication Strategy**:
- Primary: `googleMapsUrl` unique when present (most reliable for maps-sourced leads)
- Secondary: `email + city + country` combination when googleMapsUrl missing
- On duplicate: Merges missing fields, updates `lastImportedAt`, returns `existing: true`

**Campaign-Ready Fields**:
- `source`: Import source (default: "maps-helper") - indexed for filtering
- `marketingOptIn`: Email/SMS consent (default: false)
- `tags`: Array of strings for segmentation
- `lastImportedAt`: Tracks sync timestamp

**Error Responses**:
- 401: Missing or invalid Authorization header
- 403: Invalid API key
- 400: Validation errors (with field-level details)
- 409: Duplicate detected (unique constraint)
- 500: Server error

**Usage Example**:
```bash
curl -X POST "https://yourapp.replit.app/api/external/leads/import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-import-api-key" \
  -d '{"name":"Smile Dental", "city":"New York", "googleMapsUrl":"https://maps.google.com/place?id=abc123", "source":"maps-helper"}'
```

## External Dependencies

**Third-Party Services**:
- **Replit AI Integrations**: OpenAI-compatible API for GPT models.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Stripe**: Payment processing for subscription tiers.
- **Resend**: Transactional email delivery (via Replit connector).
- **Google Fonts**: Inter font family.

**Key NPM Packages**:
- **UI Components**: @radix-ui/* primitives, shadcn/ui.
- **Forms**: react-hook-form, @hookform/resolvers.
- **Data Fetching**: @tanstack/react-query.
- **Database**: drizzle-orm, @neondatabase/serverless.
- **Authentication**: express-session, bcrypt.
- **Utilities**: zod, date-fns, papaparse.
- **Icons**: lucide-react, react-icons.

**Environment Variables**:
- `DATABASE_URL`
- `SESSION_SECRET`
- `REPL_ID`
- `AI_INTEGRATIONS_OPENAI_BASE_URL`
- `AI_INTEGRATIONS_OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Email Configuration**: No manual environment variables required - Resend integration is managed via Replit's connector system.