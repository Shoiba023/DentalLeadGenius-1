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