# DentalLeadGenius

## Overview
DentalLeadGenius is an AI-powered lead generation platform designed for dental clinics. It automates outreach, manages leads through sales funnels, and provides intelligent chatbots for sales and patient interactions. The platform supports multi-clinic management with custom branding and offers instant demo delivery. Its primary purpose is to enhance lead conversion and streamline patient engagement for dental practices, aiming for significant market potential in the dental industry by improving efficiency and patient acquisition.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend uses React with TypeScript and Vite, employing `shadcn/ui` (New York style) based on Radix UI and Tailwind CSS for a B2B SaaS aesthetic. Client-side routing separates public and authenticated routes. The design prioritizes a responsive, mobile-first approach.

### Technical Implementations
The backend is an Express.js application with TypeScript (ESM modules) providing a RESTful API. Custom email/password authentication uses bcrypt, and session data is stored in PostgreSQL. AI integrations leverage the OpenAI API for chatbots and outreach message generation. PostgreSQL with Drizzle ORM handles data storage, accessed via Neon's serverless driver. The system enforces multi-tenant isolation using `clinicId` for all scoped resources and provides a Clinic Switcher for managing multiple clinics.

### Feature Specifications
*   **Campaign Hub**: Manages multi-channel outreach (Email, SMS, WhatsApp, social media) with various campaign statuses and platform-specific copy.
*   **AI Chatbots**: Sales Chatbot (demo bookings) and Patient Chatbot (appointment bookings) utilize GPT-4o for intelligent responses and conversation management.
*   **Lead Services**: Includes Lead Segmentation (status, source, tags), Nurture Campaigns (automated 3-step follow-ups), and Booking Tracking (campaign attribution).
*   **Automated Outreach Engines**:
    *   **Automated Outreach Engine**: Automatically creates email campaigns for new leads, enrolls eligible leads, and paces email sends.
    *   **Marketing Sync Engine**: Autonomous 24/7 email outreach with AI-powered personalized email generation, cooldown enforcement, and detailed logging.
    *   **GENIUS Email Automation Engine**: A 7-day email sales sequence with templated messages, budget controls, and an admin dashboard for management and reporting.
    *   **PHASE-2 Optimization Engine**: Advanced conversion optimization featuring lead scoring, send-time AI optimization, template variation A/B testing, hot/dead lead tracking, and AI-powered response handling.
*   **External API (Lead Import)**: Provides an idempotent API for single and bulk lead imports from external tools like DentalMapsHelper, with bearer token authentication and deduplication.
*   **Email Infrastructure**: Resend handles transactional email delivery for notifications and demo link distribution.
*   **Site Configuration**: A centralized `shared/config.ts` manages global branding elements.

### System Design Choices
*   **Authentication**: Custom email/password with bcrypt, PostgreSQL-backed sessions (7-day TTL), `isAuthenticated` middleware, and `isAdmin` roles.
*   **Data Management**: Drizzle ORM for type-safe database operations, `server/storage.ts` for abstracting database interactions.
*   **AI Integration**: Utilizes OpenAI API (GPT-4o) for content generation and chatbot interactions.
*   **External Integrations**: Seamless syncing with DentalMapsHelper for lead data, including auto-clinic mapping and defaults for new leads.

## External Dependencies

### Third-Party Services
*   **Replit AI Integrations**: OpenAI-compatible API for GPT models.
*   **Neon Database**: Serverless PostgreSQL hosting.
*   **Stripe**: Payment processing.
*   **Resend**: Transactional email delivery.
*   **Google Fonts**: Inter font family.

### Key NPM Packages
*   `@radix-ui/*`, `shadcn/ui`
*   `react-hook-form`, `@hookform/resolvers`
*   `@tanstack/react-query`
*   `drizzle-orm`, `@neondatabase/serverless`
*   `express-session`, `bcrypt`
*   `zod`, `date-fns`, `papaparse`
*   `lucide-react`, `react-icons`

### Environment Variables
*   `DATABASE_URL`
*   `SESSION_SECRET`
*   `REPL_ID`
*   `AI_INTEGRATIONS_OPENAI_BASE_URL`
*   `AI_INTEGRATIONS_OPENAI_API_KEY`
*   `STRIPE_SECRET_KEY`
*   `STRIPE_WEBHOOK_SECRET`
*   `IMPORT_API_KEY`