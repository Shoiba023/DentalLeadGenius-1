# DentalLeadGenius

## Overview

DentalLeadGenius is an AI-powered lead generation platform designed for dental clinics. The application automates outreach campaigns, manages leads through various stages of the sales funnel, and provides intelligent chatbot capabilities for both sales (clinic owners) and patient interactions. The platform supports multi-clinic management, allowing dental practices to create branded patient-facing pages with custom chatbots.

**Core Features:**
- **AI Chatbots**: Sales chatbot for clinic owner lead generation and patient chatbots for appointment booking
- **Lead Management**: Import, track, and manage leads through stages (new, contacted, replied, demo booked, won, lost)
- **Outreach Campaigns**: Multi-channel campaigns (email, SMS, WhatsApp) with AI-generated messaging
- **Multi-Clinic Platform**: Create and manage multiple clinic profiles with custom branding
- **Analytics Dashboard**: Track lead metrics, conversion rates, and campaign performance

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool

**UI Component System**: shadcn/ui (New York style) built on Radix UI primitives with Tailwind CSS for styling. The design follows a hybrid approach:
- Marketing/patient areas: Clean B2B SaaS aesthetic (Linear-inspired) with conversational UI patterns
- Admin dashboard: Tailwind UI conventions for data-dense interfaces
- Typography: Inter for body text, Cal Sans/Lexend for headlines

**Routing**: Wouter for client-side routing with two distinct route sets:
- Public routes: Landing page and clinic-specific pages
- Authenticated admin routes: Analytics, Leads, Outreach, Clinics management

**State Management**: TanStack Query (React Query) for server state with custom query client configuration. Authentication state managed through `/api/auth/user` endpoint.

**Key Design Patterns**:
- Component composition with Radix UI primitives
- Custom hooks for reusable logic (useAuth, useToast, useIsMobile)
- Form handling with React Hook Form and Zod validation
- Responsive design with mobile-first approach

### Backend Architecture

**Framework**: Express.js with TypeScript (ESM modules)

**Server Structure**:
- Development mode: Vite middleware integration for HMR
- Production mode: Serves static built assets
- Session-based authentication using express-session with PostgreSQL session store

**API Design**: RESTful API with routes grouped by resource:
- `/api/auth/*` - Authentication endpoints (Replit OIDC)
- `/api/leads/*` - Lead management (CRUD, import, status updates)
- `/api/clinics/*` - Clinic management
- `/api/outreach/*` - Campaign management and AI draft generation
- `/api/chatbot/*` - Chatbot thread and message handling
- `/api/analytics` - Dashboard metrics

**Authentication**: Replit Auth integration using OpenID Connect (OIDC) with Passport.js strategy. Session data stored in PostgreSQL for persistence across server restarts.

**AI Integration**: OpenAI API (via Replit AI Integrations service) for:
- Sales chatbot conversations (system prompt for DentalLeadGenius sales)
- Patient chatbot conversations (clinic-specific prompts)
- Outreach message generation

### Chatbot Flow

**Overview**: The chatbot system provides two types of AI-powered conversational interfaces:
1. **Sales Chatbot** - Appears on the homepage to convert visitors into demo bookings
2. **Patient Chatbot** - Appears on clinic pages to help patients book appointments

**Technical Flow**:
1. User opens chat widget (floating button in bottom-right corner)
2. Widget sends initial greeting message to `/api/chatbot/send`
3. Backend creates a new `chatbot_thread` record in database
4. User's message is saved to `chatbot_messages` table
5. Backend fetches conversation history and sends to OpenAI API
6. AI response is generated using GPT-4o with specialized system prompts:
   - Sales chatbot: Trained to highlight DentalLeadGenius features and collect demo booking info
   - Patient chatbot: Trained to answer dental questions and collect appointment info
7. AI response is saved to `chatbot_messages` table
8. Response is returned to frontend and displayed in chat window
9. Frontend periodically refetches messages via `/api/chatbot/messages/:threadId`

**Key Components**:
- Frontend: `client/src/components/chatbot-widget.tsx`
- Backend routes: `server/routes.ts` (`/api/chatbot/send`, `/api/chatbot/messages/:threadId`)
- AI logic: `server/openai.ts` (`generateChatResponse` function)
- Database: `chatbot_threads` and `chatbot_messages` tables

### Data Storage Solutions

**Database**: PostgreSQL accessed via Neon serverless driver with WebSocket support

**ORM**: Drizzle ORM for type-safe database operations with schema-first approach

**Schema Design**:
- `users` - User accounts with Replit Auth integration
- `sessions` - Session storage for authentication
- `leads` - Lead contacts with status tracking
- `clinics` - Multi-tenant clinic profiles with branding
- `clinic_users` - Many-to-many relationship for clinic access
- `bookings` - Demo bookings from sales chatbot
- `chatbot_threads` - Conversation threads (sales or patient type)
- `chatbot_messages` - Individual messages within threads
- `outreach_campaigns` - Campaign configurations with daily limits
- `patient_bookings` - Appointment bookings from patient chatbots

**Data Access Layer**: Storage interface pattern (`IStorage`) implemented in `server/storage.ts` for abstraction between business logic and database operations.

### Authentication and Authorization

**Primary Method**: Replit Auth (mandatory) using OIDC flow
- Login redirects to Replit OIDC provider
- Tokens stored in user session
- User profile data synced to local database

**Session Management**: 
- PostgreSQL-backed sessions (7-day TTL)
- HTTP-only, secure cookies
- Session secret from environment variable

**Authorization Strategy**:
- `isAuthenticated` middleware checks for valid session
- Admin routes protected by authentication requirement
- Public routes (landing, clinic pages) accessible without auth
- User roles supported via `isAdmin` flag (future admin panel access control)

### External Dependencies

**Third-Party Services**:
- **Replit Auth**: User authentication via OIDC
- **Replit AI Integrations**: OpenAI-compatible API for GPT models (currently gpt-5)
- **Neon Database**: Serverless PostgreSQL hosting
- **Google Fonts**: Inter font family for typography

**Key NPM Packages**:
- **UI Components**: @radix-ui/* primitives, shadcn/ui components
- **Forms**: react-hook-form with @hookform/resolvers for validation
- **Data Fetching**: @tanstack/react-query
- **Database**: drizzle-orm, @neondatabase/serverless
- **Authentication**: passport, openid-client, express-session
- **Utilities**: zod (validation), date-fns (date handling), papaparse (CSV import)
- **Icons**: lucide-react, react-icons

**Asset Management**:
- Static assets stored in `attached_assets/` directory
- Vite alias configuration for `@assets` imports
- Images served through Vite dev server or static build output

**Environment Variables Required**:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret
- `REPL_ID` - Replit workspace identifier
- `ISSUER_URL` - OIDC issuer (defaults to Replit)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - AI service endpoint
- `AI_INTEGRATIONS_OPENAI_API_KEY` - AI service authentication