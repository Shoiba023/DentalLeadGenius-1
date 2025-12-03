# DentalLeadGenius

## Overview
DentalLeadGenius is an AI-powered lead generation platform for dental clinics. It automates outreach, manages leads through sales funnels, and provides intelligent chatbots for sales and patient interactions. The platform supports multi-clinic management with custom branding and offers instant demo delivery. Its primary purpose is to enhance lead conversion and streamline patient engagement for dental practices, aiming for significant market potential in the dental industry.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React and TypeScript using Vite. It utilizes `shadcn/ui` (New York style) based on Radix UI and Tailwind CSS for a B2B SaaS aesthetic. Wouter handles client-side routing, separating public and authenticated routes. State management for server data is done with TanStack Query, and authentication is managed via an `/api/auth/session` endpoint. Key design patterns include component composition, custom hooks, React Hook Form with Zod validation, and a responsive mobile-first approach.

### Backend
The backend is an Express.js application with TypeScript (ESM modules), serving a RESTful API. Custom email/password authentication uses bcrypt for hashing, and session data is stored in PostgreSQL with a 7-day expiration, supporting role-based access. AI integration leverages the OpenAI API for sales chatbots, patient chatbots, and outreach message generation.

### Campaign Hub (Outreach Manager)
The Campaign Hub supports multi-channel outreach including Email, SMS, WhatsApp, and social media platforms (Facebook, Instagram, YouTube, TikTok). It allows creation and management of campaigns with specific fields for social posts (`targetUrl`, `mediaUrl`, `hashtags`). Campaigns have various statuses (draft, active, completed) and include platform-specific copy buttons for manual posting.

### Chatbot Flow
The platform features two AI chatbots: a Sales Chatbot for demo bookings on the homepage and a Patient Chatbot for appointment bookings on clinic pages. Both interact with the backend to manage conversation history and generate AI responses using GPT-4o with specialized prompts.

### Data Storage Solutions
PostgreSQL is used as the database via Neon's serverless driver, with Drizzle ORM for type-safe operations. The schema includes tables for users, sessions, leads, clinics, bookings, chatbot interactions, and outreach campaigns. A `server/storage.ts` interface abstracts database operations.

### Authentication and Authorization
Custom email/password authentication with bcrypt and PostgreSQL-backed sessions (7-day TTL) provides secure access. `isAuthenticated` middleware protects routes, and user roles are supported via an `isAdmin` flag.

### Multi-Tenant Isolation
The system employs multi-tenant isolation, tracking a `selectedClinicId` for each authenticated session. All clinic-scoped resources include a `clinicId` foreign key, ensuring data isolation. The `requireClinicContext()` helper validates authentication and clinic membership, and a Clinic Switcher allows users to manage multiple clinics.

### Site Configuration
A centralized `shared/config.ts` file stores global brand identity and contact details like `SITE_NAME`, `SITE_URL`, and `SUPPORT_EMAIL` for consistent application-wide branding.

### Email Infrastructure
Resend, integrated via Replit connector, handles transactional email delivery. The `server/email.ts` service provides functions for generic email sending, support notifications, lead capture notifications, and demo link delivery. Health check endpoints are available for email configuration and testing.

### Lead Segmentation Service
The `server/leadSegmentation.ts` service provides functions to manage lead statuses (new, contacted, warm, converted), sources, and tags. It offers APIs to update lead statuses, add/remove tags, and retrieve segmentation summaries.

### Nurture Campaign Service
The `server/nurtureCampaign.ts` service automates 3-step follow-up sequences for new leads, scheduling welcome, value proposition, and CTA emails. It tracks nurture status and provides APIs to run campaigns and retrieve lead nurture progress.

### Booking Tracking Service
The `server/bookingTracking.ts` service focuses on campaign attribution and lead conversion tracking for patient bookings. It records booking sources and links bookings to campaigns and leads, providing analytics for clinics and campaigns.

### External API (Lead Import)
A production-grade API allows idempotent lead imports from external tools like DentalMapsHelper. It supports single and bulk imports, using bearer token authentication and deduplication strategies based on `googleMapsUrl` or `email + city + country`.

### DentalMapsHelper Integration
This integration facilitates automated lead syncing from DentalMapsHelper to the Lead Library and Campaign Hub. It stores complete lead data including:
- **Core Fields**: name, email, phone, address, city, state, country
- **Google Data**: googleMapsUrl, websiteUrl, rating (e.g., "4.8"), reviewCount
- **Sync Tracking**: syncStatus, externalSourceId, lastSyncedAt, source
- **Campaign Readiness**: marketingOptIn flag for filtering eligible leads

**Auto Clinic Mapping**: Every lead automatically gets a valid clinicId:
1. If clinicId provided → uses it directly
2. If no clinicId → searches existing clinics by googleMapsUrl or name+city+state
3. If no match found → creates new clinic from lead data

**API Endpoints** (Bearer token: `IMPORT_API_KEY`):
- `POST /api/external/leads/import` - Single lead import with auto clinic mapping
- `POST /api/external/leads/bulk-import` - Bulk import with auto clinic mapping
- `POST /api/external/clinics/sync` - Sync clinics from DentalMapsHelper
- `GET /api/external/clinics` - Returns clinics with clinicId, name, city, state

**Defaults for new leads**: syncStatus="synced", status="new", marketingOptIn=true

The Lead Library UI displays rating with star icon, review count, source badge, and sync status. The Campaign Hub allows auto-loading synced leads into campaigns with one click, filtering by syncStatus="synced" and marketingOptIn=true. Campaign creation requires clinic selection (validated frontend and backend). Security ensures clinic context and ownership.

## External Dependencies

### Third-Party Services
*   **Replit AI Integrations**: OpenAI-compatible API for GPT models.
*   **Neon Database**: Serverless PostgreSQL hosting.
*   **Stripe**: Payment processing for subscription tiers.
*   **Resend**: Transactional email delivery (via Replit connector).
*   **Google Fonts**: Inter font family.

### Key NPM Packages
*   **UI Components**: `@radix-ui/*`, `shadcn/ui`.
*   **Forms**: `react-hook-form`, `@hookform/resolvers`.
*   **Data Fetching**: `@tanstack/react-query`.
*   **Database**: `drizzle-orm`, `@neondatabase/serverless`.
*   **Authentication**: `express-session`, `bcrypt`.
*   **Utilities**: `zod`, `date-fns`, `papaparse`.
*   **Icons**: `lucide-react`, `react-icons`.

### Environment Variables
*   `DATABASE_URL`
*   `SESSION_SECRET`
*   `REPL_ID`
*   `AI_INTEGRATIONS_OPENAI_BASE_URL`
*   `AI_INTEGRATIONS_OPENAI_API_KEY`
*   `STRIPE_SECRET_KEY`
*   `STRIPE_WEBHOOK_SECRET`