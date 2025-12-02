# DentalLeadGenius System Guide

> A comprehensive guide to understanding, operating, and developing the DentalLeadGenius platform.

**Version:** 1.0  
**Last Updated:** December 2024  
**Domain:** dentalleadgenius.com

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [Main Flows](#4-main-flows)
5. [How to Use as an Operator](#5-how-to-use-as-an-operator)
6. [How to Develop](#6-how-to-develop)
7. [Auto Follow-up Campaign](#7-auto-follow-up-campaign)
8. [Admin Dashboard](#8-admin-dashboard)
9. [Appointment Booking Flow](#9-appointment-booking-flow)
10. [FAQ & Troubleshooting](#10-faq--troubleshooting)
11. [Lead Segmentation Service](#11-lead-segmentation-service)
12. [3-Step Nurture Campaign](#12-3-step-nurture-campaign)
13. [Booking Attribution & Tracking](#13-booking-attribution--tracking)

---

## 1. Overview

### What is DentalLeadGenius?

DentalLeadGenius is an AI-powered lead generation and management platform designed specifically for dental clinics. It helps dental practices:

- **Capture leads** from multiple sources (website, DentalMapsHelper, manual imports)
- **Manage leads** through a visual sales pipeline (new → contacted → warm → converted)
- **Send email campaigns** to nurture leads and drive bookings
- **Book appointments** directly from campaign emails
- **Track performance** with real-time analytics dashboards

### Who is it for?

| User Type | Description |
|-----------|-------------|
| **Clinic Owners** | Dental practice owners who want to grow their patient base |
| **Virtual Assistants** | VAs managing lead outreach for dental clinics |
| **Marketing Teams** | Teams running multi-channel outreach campaigns |
| **Administrators** | Platform admins managing multiple clinics |

### Key Features

- 🦷 **Multi-Clinic Support**: Manage multiple dental practices from one account
- 📧 **Email Campaigns**: Create and send campaigns to opted-in leads
- 🤖 **AI Chatbots**: Sales chatbot on homepage, patient chatbot on clinic pages
- 🔄 **Lead Sync**: Automatic import from DentalMapsHelper and other sources
- 📊 **Analytics Dashboard**: Real-time metrics on leads, campaigns, and bookings
- 📅 **Appointment Booking**: Direct booking links in campaign emails
- 🔐 **Secure Auth**: Email/password authentication with session management

---

## 2. Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + TypeScript + Vite + TailwindCSS + shadcn/ui        │
│  ├── Landing Page (/)                                        │
│  ├── Demo Page (/demo)                                       │
│  ├── Clinic Pages (/clinic/:slug)                            │
│  └── Dashboard (/dashboard/*)                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  Express.js + TypeScript                                     │
│  ├── Authentication (session-based)                          │
│  ├── REST API Routes                                         │
│  ├── Email Service (Resend)                                  │
│  ├── AI Integration (OpenAI)                                 │
│  └── Campaign Scheduler                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ SQL
┌─────────────────────────────────────────────────────────────┐
│                        DATABASE                              │
│  PostgreSQL (Neon Serverless)                               │
│  ├── Users & Sessions                                        │
│  ├── Clinics & Clinic Users                                  │
│  ├── Leads                                                   │
│  ├── Campaigns & Sequences                                   │
│  └── Bookings                                                │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui |
| Routing | Wouter (client-side) |
| State Management | TanStack Query (server state) |
| Backend | Express.js, TypeScript (ESM) |
| Database | PostgreSQL via Neon Serverless |
| ORM | Drizzle ORM |
| Email | Resend (via Replit connector) |
| AI | OpenAI GPT-4o |
| Payments | Stripe |
| Authentication | Custom email/password with bcrypt |

### Key Directories

```
DentalLeadGenius/
├── client/                  # Frontend React application
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route pages
│       ├── hooks/           # Custom React hooks
│       └── lib/             # Utilities and query client
├── server/                  # Backend Express application
│   ├── routes.ts            # API route definitions
│   ├── storage.ts           # Database operations
│   ├── email.ts             # Email sending service
│   └── openai.ts            # AI chat integration
├── shared/                  # Shared types and schemas
│   ├── schema.ts            # Drizzle database schema
│   └── config.ts            # Site configuration
└── docs/                    # Documentation
```

---

## 3. Data Model

### Entity Relationship Overview

```
Users ◄──────┬─────► Clinics
             │         │
      ClinicUsers      │
                       │
             ┌─────────┴─────────┐
             │                   │
           Leads             Campaigns
             │                   │
      ┌──────┴──────┐           │
      │             │           │
  Bookings    Enrollments ◄─────┘
                    │
               Sequences
                    │
             SequenceSteps
```

### Core Tables

#### Users
Stores all user accounts (admins and clinic users).

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | varchar | Unique email address |
| password | varchar | Bcrypt-hashed password |
| firstName, lastName | varchar | User's name |
| role | varchar | "admin" or "clinic" |
| isAdmin | boolean | Platform admin flag |
| stripeCustomerId | varchar | Stripe integration |
| subscriptionTier | varchar | essential/growth/elite |

#### Clinics
Represents dental practices on the platform.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | text | Clinic display name |
| slug | text | URL-friendly identifier |
| logoUrl | text | Clinic logo image |
| brandColor | text | Primary brand color (hex) |
| ownerId | UUID | Reference to owner user |
| address, phone, website | text | Contact details |
| services | text[] | Array of offered services |
| onboardingCompleted | boolean | Setup completion status |

#### Leads
Potential customers for dental clinics.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| clinicId | UUID | Associated clinic (nullable for demo leads) |
| name | text | Lead's name or business name |
| email | text | Contact email |
| phone | text | Contact phone |
| city, state, country | text | Location |
| source | text | Origin: "maps-helper", "manual", "demo-request" |
| status | text | Pipeline stage (see below) |
| marketingOptIn | boolean | Email consent flag |
| tags | text[] | Segmentation tags |
| googleMapsUrl | text | Unique deduplication key |

**Lead Status Values:**
- `new` - Just imported, not yet contacted
- `contacted` - First outreach sent
- `replied` - Lead responded
- `warm` - Showed interest (clicked booking link)
- `demo_booked` - Scheduled a demo
- `won` - Converted to customer
- `lost` - Marked as not interested

#### Outreach Campaigns
Email and social media campaigns.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| clinicId | UUID | Associated clinic |
| name | text | Campaign name |
| type | text | "email", "sms", "facebook_post", etc. |
| subject | text | Email subject line |
| message | text | Campaign content |
| status | text | "draft", "ready", "active", "completed" |
| dailyLimit | integer | Max emails per day |
| totalSent | integer | Total emails sent |

#### Sequences
Multi-step automated follow-up flows.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| clinicId | UUID | Associated clinic |
| name | text | Sequence name |
| sequenceType | text | "new_lead", "missed_call", "custom" |
| status | text | "draft", "active", "paused" |

#### Sequence Steps
Individual emails in a sequence.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| sequenceId | UUID | Parent sequence |
| stepOrder | integer | Position in sequence (1, 2, 3...) |
| channel | text | "email", "sms" |
| subject | text | Email subject |
| message | text | Email body |
| delayDays | integer | Days to wait after previous step |

#### Sequence Enrollments
Tracks which leads are in which sequences.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| sequenceId | UUID | The sequence |
| leadId | UUID | The enrolled lead |
| currentStepOrder | integer | Current position |
| status | text | "active", "completed", "cancelled" |
| nextSendAt | timestamp | When to send next email |

#### Patient Bookings
Appointment requests from leads.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| clinicId | UUID | Associated clinic |
| leadId | UUID | Optional: linked lead |
| patientName | text | Booker's name |
| patientEmail | text | Booker's email |
| preferredDate | text | Requested date |
| preferredTime | text | Requested time |
| status | text | "pending", "confirmed", "completed" |
| sourceCampaignId | UUID | Which campaign drove this booking |
| sourceSequenceStep | integer | Which step in the sequence |

---

## 4. Main Flows

### 4.1 Lead Sync / Import

#### From DentalMapsHelper (API Import)

1. **External System** sends POST request to `/api/external/leads/import`
2. **Authentication**: Bearer token validated against `IMPORT_API_KEY`
3. **Validation**: Lead data validated against schema
4. **Deduplication**: 
   - Primary: Check `googleMapsUrl` (unique index)
   - Secondary: Check `email + city + country`
5. **Upsert**: Create new lead or merge with existing
6. **Response**: Return lead ID and existing flag

```bash
# Example API call
curl -X POST "https://dentalleadgenius.com/api/external/leads/import" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smile Dental Clinic",
    "email": "info@smileclinic.com",
    "city": "Los Angeles",
    "googleMapsUrl": "https://maps.google.com/place?id=abc123",
    "source": "maps-helper",
    "marketingOptIn": true
  }'
```

#### Manual Import (CSV)

1. User uploads CSV file in Dashboard > Leads
2. System parses file using Papa Parse
3. Each row validated and inserted
4. Duplicates detected and skipped/merged

### 4.2 Lead Segmentation

Leads are automatically segmented based on:

| Segment | Criteria | Action |
|---------|----------|--------|
| New Leads | `status = "new"` | Target for welcome campaign |
| Contacted | `status = "contacted"` | Follow-up sequences eligible |
| Warm Leads | `status = "warm"` OR clicked booking link | Priority outreach |
| Converted | `status = "won"` OR has booking | Remove from campaigns |
| Lost | `status = "lost"` | Archive |

**Tags for Additional Segmentation:**
- `high_value` - Premium service interest
- `no_show` - Missed appointments
- `insurance_question` - Asked about coverage
- `maps-helper` - Imported from DentalMapsHelper

### 4.3 Email Campaign Creation and Sending

#### Creating a Campaign

1. Navigate to Dashboard > Campaign Hub
2. Click "Create Campaign"
3. Fill in:
   - **Name**: Internal identifier
   - **Type**: Email (or social platform)
   - **Subject**: Email subject line
   - **Message**: Email body content
   - **Daily Limit**: Max emails per day (default: 50)
4. Save as Draft or Ready

#### Sending a Campaign

1. Campaign must be "ready" status
2. Click "Run Campaign" or trigger via API
3. System:
   - Fetches leads with `marketingOptIn = true`
   - Filters by clinic scope
   - Sends emails via Resend
   - Updates lead status to "contacted"
   - Logs campaign stats

```
POST /api/campaigns/:id/run
```

### 4.4 Follow-up Campaigns (Sequences)

Automated multi-step email sequences:

1. **Sequence Created** with steps (Day 0, Day 2, Day 5)
2. **Leads Enrolled** when matching criteria (e.g., new import)
3. **Scheduler Runs** periodically:
   - Finds enrollments where `nextSendAt <= now()`
   - Sends the current step's email
   - Advances to next step or marks complete
4. **Tracking**: Each enrollment tracks current step and completion

### 4.5 Appointment Booking

1. **Lead receives email** with "Book Consultation" button
2. **Button URL** includes: `/book?leadId=xxx&clinicId=yyy&campaign=zzz`
3. **Booking Page** shows:
   - Pre-filled lead info (if available)
   - Date/time picker
   - Appointment type selector
4. **On Submit**:
   - Create `PatientBooking` record
   - Link to lead via `leadId`
   - Update lead status to "converted"
   - Log campaign/step attribution

---

## 5. How to Use as an Operator

This section is for clinic staff, VAs, and non-technical users.

### Getting Started

#### 5.1 Logging In

1. Go to [dentalleadgenius.com/login](https://dentalleadgenius.com/login)
2. Enter your email and password
3. Click "Log In"
4. You'll be taken to your dashboard

#### 5.2 Dashboard Overview

The dashboard shows:
- **Stats Cards**: Total leads, contacted, demos booked, won
- **Quick Actions**: Links to Leads, Clinics, Campaigns
- **Recent Activity**: Latest leads and bookings

### Managing Clinics

#### Adding a New Clinic

1. Click "Clinics" in the sidebar
2. Click "Add Clinic" button
3. Fill in:
   - Clinic Name
   - Slug (URL-friendly name, e.g., "smile-dental")
   - Logo (optional)
   - Brand Color
   - Contact Details
4. Click "Create Clinic"

#### Switching Between Clinics

If you manage multiple clinics:
1. Look for the clinic selector in the sidebar
2. Click to see your clinics
3. Select the one you want to work with
4. All data will filter to that clinic

### Managing Leads

#### Viewing Leads

1. Click "Leads" in the sidebar
2. See all leads for your current clinic
3. Use filters:
   - **Status**: New, Contacted, Warm, Converted, Lost
   - **Source**: DentalMapsHelper, Manual, Website
   - **Search**: Type name or email

#### Importing Leads Manually

1. In Leads page, click "Import"
2. Choose CSV file with columns: name, email, phone, city
3. Map columns if needed
4. Click "Import"
5. Check for duplicates message

#### Editing a Lead

1. Click on a lead's row
2. Edit any field
3. Click "Save Changes"

#### Updating Lead Status

1. Find the lead
2. Click the status dropdown
3. Select new status (e.g., "Contacted" → "Warm")
4. Status updates automatically

### Running Campaigns

#### Creating an Email Campaign

1. Click "Campaign Hub" in sidebar
2. Click "Create Campaign"
3. Enter:
   - **Name**: "December Welcome Campaign"
   - **Subject**: "Grow Your Dental Practice with AI"
   - **Message**: Write your email content
4. Click "Save as Draft"

#### Sending a Campaign

1. Find your campaign in the list
2. Make sure status is "Ready"
3. Click "▶ Run"
4. Confirm the send
5. Watch the progress bar
6. Check results in campaign stats

#### Understanding Campaign Stats

| Stat | Meaning |
|------|---------|
| Total Sent | Emails successfully delivered |
| Sent Today | Emails sent in last 24 hours |
| Daily Limit | Maximum allowed per day |
| Status | draft/ready/active/completed |

### Handling Bookings

#### Viewing Incoming Bookings

1. Click "Patient Bookings" in sidebar
2. See all pending appointment requests
3. New bookings appear at the top

#### Confirming a Booking

1. Find the booking
2. Review patient info and preferred time
3. Click "Confirm" button
4. Patient receives confirmation (if email enabled)

#### Linking Bookings to Leads

Bookings made through campaign links are automatically linked. For manual bookings:
1. Open the booking
2. Click "Link to Lead"
3. Search for the lead
4. Select and save

### Seeing Results

#### Analytics Dashboard

Click "Analytics" in sidebar to see:
- **Lead Funnel**: New → Contacted → Warm → Converted
- **Campaign Performance**: Open rates, click rates
- **Bookings**: This week vs last week
- **Top Sources**: Where leads come from

#### Exporting Reports

1. Go to any list view (Leads, Campaigns, Bookings)
2. Click "Export" button
3. Choose CSV or PDF
4. File downloads to your computer

---

## 6. How to Develop

This section is for developers working on the codebase.

### Setting Up Locally

#### Prerequisites

- Node.js 18+
- npm
- PostgreSQL database (Neon account or local)

#### Environment Variables

Create `.env` file:
```env
DATABASE_URL=postgresql://...
SESSION_SECRET=your-random-secret
IMPORT_API_KEY=your-import-api-key
```

#### Install and Run

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The app runs at `http://localhost:5000`

### Project Structure

```
server/
├── routes.ts          # All API endpoints
├── storage.ts         # Database operations (IStorage interface)
├── email.ts           # Resend email integration
├── openai.ts          # AI chat responses
└── db.ts              # Drizzle database connection

client/src/
├── App.tsx            # Main router
├── pages/             # Page components
│   ├── admin-*.tsx    # Dashboard pages
│   └── landing.tsx    # Public pages
├── components/
│   ├── ui/            # shadcn/ui components
│   └── app-sidebar.tsx
└── hooks/
    └── useAuth.ts     # Authentication hook

shared/
├── schema.ts          # Drizzle ORM schema
└── config.ts          # Site configuration
```

### Key Files

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Database tables, types, Zod schemas |
| `server/storage.ts` | All database CRUD operations |
| `server/routes.ts` | API endpoints |
| `server/email.ts` | Email sending via Resend |
| `client/src/App.tsx` | Frontend routing |
| `client/src/lib/queryClient.ts` | TanStack Query setup |

### Adding a New Feature

#### Example: Adding a "Notes" Field to Campaigns

1. **Update Schema** (`shared/schema.ts`):
```typescript
export const outreachCampaigns = pgTable("outreach_campaigns", {
  // ... existing fields
  internalNotes: text("internal_notes"), // Add new field
});
```

2. **Push to Database**:
```bash
npm run db:push
```

3. **Update Storage** (`server/storage.ts`):
The existing methods will automatically include the new field.

4. **Update API** (`server/routes.ts`):
Add field to validation schema if needed.

5. **Update Frontend** (`client/src/pages/admin-outreach.tsx`):
Add input field to the form.

### Adding a New API Endpoint

```typescript
// In server/routes.ts
app.get("/api/my-new-endpoint", async (req, res) => {
  // Check authentication
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Get data
  const data = await storage.myNewMethod();
  
  // Return response
  res.json(data);
});
```

### Adding a New Page

1. Create file in `client/src/pages/my-page.tsx`
2. Add route in `client/src/App.tsx`:
```typescript
<Route path="/dashboard/my-page" component={MyPage} />
```
3. Add to sidebar in `client/src/components/app-sidebar.tsx`

### Database Migrations

We use Drizzle ORM with `db:push` for schema changes:

```bash
# Safe schema sync
npm run db:push

# Force sync (use carefully)
npm run db:push --force
```

⚠️ **Never change primary key types** (serial ↔ varchar)

### Testing

```bash
# Run all tests
npm test

# Test specific file
npm test -- --grep "campaigns"
```

### Debugging

1. **Check Logs**: View terminal output for server errors
2. **Browser DevTools**: Check Network tab for API failures
3. **Database**: Use `execute_sql_tool` for queries
4. **Email**: Check Resend dashboard for delivery status

---

## 7. Auto Follow-up Campaign

### 3-Step Nurture Sequence

The platform includes an automated 3-step nurture campaign for new leads:

| Step | Timing | Purpose |
|------|--------|---------|
| 1 | Day 0 (Immediate) | Welcome + Introduction |
| 2 | Day 2 | Social proof + Benefits |
| 3 | Day 5 | Urgency + Final CTA |

### How It Works

1. **Lead Imported** → Automatically enrolled in nurture sequence
2. **Step 1 Sends Immediately** → Welcome email
3. **Scheduler Checks Daily** → Looks for leads ready for next step
4. **Step 2 at Day 2** → Benefits email sent
5. **Step 3 at Day 5** → Urgency email with booking link
6. **Completion** → Lead marked as "nurture_complete"

### Email Templates

**Step 1: Welcome**
```
Subject: Welcome to DentalLeadGenius - Let's Grow Your Practice!

Hi {name},

Thanks for connecting with us! DentalLeadGenius helps dental clinics 
like yours capture more leads and convert them into loyal patients.

Here's what we can do for you:
- AI-powered chatbots for 24/7 patient engagement
- Automated follow-up campaigns
- Smart lead scoring and prioritization

Click here to book a free consultation: [BOOK NOW]

Best,
The DentalLeadGenius Team
```

**Step 2: Social Proof (Day 2)**
```
Subject: How Dr. Smith Increased Bookings by 40%

{name},

Dental practices using DentalLeadGenius are seeing incredible results:
- 40% more appointment bookings
- 60% reduction in missed appointments  
- 3x faster response to patient inquiries

Ready to see similar results? [SCHEDULE YOUR DEMO]
```

**Step 3: Urgency (Day 5)**
```
Subject: Last chance: Your free consultation expires soon

{name},

This is my final note - I wanted to make sure you didn't miss out 
on your complimentary practice growth consultation.

In just 15 minutes, we'll show you exactly how to:
- Double your new patient inquiries
- Automate time-consuming follow-ups
- Never miss another lead

[BOOK YOUR FREE CONSULTATION NOW]

Spots are limited this week!
```

### Monitoring Sequences

In the Dashboard:
1. Go to "Sequences" page
2. View active sequences and their stats
3. See individual enrollment status
4. Pause or cancel sequences as needed

---

## 8. Admin Dashboard

### Dashboard Overview

The Admin Dashboard provides a comprehensive view of platform activity:

#### Stats Overview Cards

- **Total Clinics**: Number of registered dental practices
- **Total Leads**: All leads across all clinics
- **Active Campaigns**: Currently running email campaigns
- **Pending Bookings**: Appointments awaiting confirmation

#### Leads by Status Chart

Visual breakdown of lead pipeline:
- New (Blue)
- Contacted (Yellow)
- Warm (Orange)
- Converted (Green)
- Lost (Gray)

#### Campaign Performance Table

| Column | Description |
|--------|-------------|
| Name | Campaign identifier |
| Type | Email/SMS/Social |
| Status | Draft/Active/Completed |
| Sent | Total emails delivered |
| Opens | Emails opened (if tracked) |
| Clicks | Links clicked |

#### Recent Leads List

Shows the 10 most recently added leads with:
- Name
- Clinic
- Email
- Status badge
- Created date

### Filtering and Sorting

**Available Filters:**
- Clinic (dropdown)
- Lead Status (multi-select)
- Date Range (last 7/30/90 days)
- Source (DentalMapsHelper, Manual, Website)

**Sort Options:**
- Date Created (newest/oldest)
- Name (A-Z/Z-A)
- Status

### Navigation

Access dashboard sections via sidebar:
- 📊 Analytics (default)
- 👥 Leads
- 🏥 Clinics
- 📧 Campaign Hub
- 🔄 Sequences
- 📅 Bookings
- 👤 Users

---

## 9. Appointment Booking Flow

### Booking Page

Located at: `/book` or `/book?leadId=xxx&clinicId=yyy`

#### Form Fields

| Field | Required | Description |
|-------|----------|-------------|
| Patient Name | Yes | Full name |
| Email | Yes | Contact email |
| Phone | Yes | Contact phone |
| Preferred Date | Yes | Desired appointment date |
| Preferred Time | Yes | Morning/Afternoon/Evening |
| Appointment Type | No | Checkup/Cleaning/Consultation |
| Notes | No | Additional information |

### Auto-Linking from Campaigns

When a lead clicks the booking link in a campaign email:

1. URL contains: `?leadId=xxx&clinicId=yyy&campaign=zzz&step=1`
2. Booking form pre-fills known lead info
3. On submit:
   - Creates booking record
   - Links to original lead
   - Records source campaign and step
   - Updates lead status to "converted"

### Campaign Email Button

All campaign emails include:

```html
<a href="https://dentalleadgenius.com/book?leadId={leadId}&clinicId={clinicId}&campaign={campaignId}">
  <button>Book Your Free Consultation</button>
</a>
```

### Booking Status Flow

```
Pending → Confirmed → Completed
    ↓
 Cancelled
```

### Viewing Bookings

Dashboard > Patient Bookings shows:
- All pending/confirmed bookings
- Source campaign attribution
- Lead information
- Clinic assignment

---

## 10. FAQ & Troubleshooting

### Common Issues

#### "Campaign not sending emails"

**Causes:**
1. No leads with `marketingOptIn = true`
2. Daily limit reached
3. Campaign status is "draft"

**Solutions:**
1. Check lead marketing consent in Leads page
2. Wait for daily limit reset or increase it
3. Set campaign status to "ready"

#### "Leads not importing from DentalMapsHelper"

**Causes:**
1. Invalid API key
2. Network connectivity
3. Lead already exists (duplicate)

**Solutions:**
1. Verify `IMPORT_API_KEY` matches between systems
2. Check server logs for connection errors
3. Check for `existing: true` in API response

#### "Booking form not pre-filling lead info"

**Causes:**
1. Missing URL parameters
2. Lead ID not found in database

**Solutions:**
1. Verify URL includes `leadId` parameter
2. Check lead exists in database

#### "Dashboard shows 0 for all stats"

**Causes:**
1. No clinic selected
2. API endpoint error
3. User lacks permissions

**Solutions:**
1. Select a clinic from the switcher
2. Check browser console for API errors
3. Verify user has access to the clinic

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Unauthorized" | Not logged in or session expired | Log in again |
| "Clinic not found" | Invalid clinic ID | Select valid clinic |
| "Lead already exists" | Duplicate import detected | Lead was merged, check existing |
| "Daily limit reached" | Campaign hit max emails | Wait or increase limit |
| "Invalid email" | Resend rejected email | Check email format |

### Getting Help

1. **Documentation**: Check this guide first
2. **Logs**: Review server logs for errors
3. **Support**: Email support@dentalleadgenius.com

### Useful API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/session` | GET | Check authentication |
| `/api/analytics` | GET | Dashboard stats |
| `/api/leads` | GET | List leads |
| `/api/campaigns` | GET | List campaigns |
| `/api/campaigns/:id/run` | POST | Execute campaign |
| `/health/email` | GET | Check email service |

---

## 11. Lead Segmentation Service

### Overview

The Lead Segmentation Service (`server/leadSegmentation.ts`) provides helper functions for managing lead statuses, sources, and tags consistently across the application.

### Lead Status Definitions

| Status | Description | Next Actions |
|--------|-------------|--------------|
| `new` | Just imported, no contact yet | Start nurture sequence |
| `contacted` | First outreach sent | Wait for response |
| `warm` | Clicked link or showed interest | Priority follow-up |
| `replied` | Responded to outreach | Personalized engagement |
| `demo_booked` | Demo scheduled | Prepare presentation |
| `won` | Converted to customer | Retention campaigns |
| `lost` | Opted out or no interest | Re-engage after 90 days |

### Helper Functions

```typescript
// Mark a lead as contacted
await markContacted(leadId);

// Mark a lead as warm (showed interest)
await markWarm(leadId);

// Mark a lead as converted
await markConverted(leadId);

// Add a tag to a lead
await addTag(leadId, "high_value");

// Remove a tag from a lead
await removeTag(leadId, "no_show");

// Get segmentation summary for a clinic
const summary = await getSegmentationSummary(clinicId);
```

### Segmentation API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/leads/:id/status` | PATCH | Update lead status |
| `/api/leads/:id/tags` | POST | Add tag to lead |
| `/api/leads/:id/tags/:tag` | DELETE | Remove tag from lead |
| `/api/segmentation/:clinicId` | GET | Get segmentation summary |

### Status Transition Rules

```
new → contacted → warm/replied → demo_booked → won
                                            ↓
                                          lost (from any status except won)
```

---

## 12. 3-Step Nurture Campaign

### Overview

The Nurture Campaign Service (`server/nurtureCampaign.ts`) provides automated 3-step follow-up sequences for new leads.

### Sequence Schedule

| Step | Day | Content Type |
|------|-----|--------------|
| Step 1 | Day 0 | Welcome & Introduction |
| Step 2 | Day 2 | Value Proposition & Features |
| Step 3 | Day 5 | Final CTA with Demo Offer |

### How It Works

1. **Lead Imports**: New leads are automatically eligible
2. **Opt-In Required**: Only sends to leads with `marketingOptIn = true`
3. **Status Tracking**: Uses tags to track completed steps:
   - `nurture_step_1_sent`
   - `nurture_step_2_sent`
   - `nurture_step_3_sent`
   - `nurture_complete`
4. **Auto-Stop**: Stops if lead replies, books demo, or opts out

### Running the Nurture Campaign

**Via API:**
```bash
POST /api/nurture/run/:clinicId
```

**Response:**
```json
{
  "processed": 5,
  "sent": 3,
  "skipped": 2,
  "errors": 0,
  "details": [...]
}
```

### Checking Nurture Status

```bash
GET /api/nurture/status/:leadId
```

**Response:**
```json
{
  "currentStep": 2,
  "completedSteps": ["STEP_1", "STEP_2"],
  "nextStep": "STEP_3",
  "isComplete": false,
  "nextStepDate": "2024-12-05T00:00:00Z"
}
```

### Email Content Templates

Each step includes:
- Personalized greeting with first name
- Clinic-branded content
- Clear call-to-action button
- Booking link with tracking parameters

---

## 13. Booking Attribution & Tracking

### Overview

The Booking Tracking Service (`server/bookingTracking.ts`) provides campaign attribution and lead conversion tracking for patient bookings.

### Booking Sources

| Source | Description |
|--------|-------------|
| `direct` | Organic website visit |
| `email` | Clicked from campaign email |
| `sms` | Clicked from SMS message |
| `chatbot` | Booked via AI chatbot |
| `website` | General website form |
| `referral` | Referred by another patient |

### Automatic Attribution

When a booking is created:
1. System searches for matching lead by email
2. Checks lead tags for campaign attribution
3. Analyzes referrer URL for source hints
4. Links booking to lead and campaign

### New Schema Fields

The `patient_bookings` table now includes:
- `campaignId`: Which campaign drove the booking
- `leadId`: Which lead converted
- `source`: How they found us

### Conversion Tracking

**Get Booking Analytics:**
```bash
GET /api/analytics/bookings/:clinicId
```

**Response:**
```json
{
  "totalBookings": 42,
  "pendingBookings": 8,
  "confirmedBookings": 30,
  "cancelledBookings": 4,
  "bookingsBySource": {
    "email": 25,
    "direct": 10,
    "chatbot": 7
  },
  "conversionRate": 8.5
}
```

**Get Campaign Conversion Stats:**
```bash
GET /api/analytics/campaign/:campaignId/conversions
```

**Response:**
```json
{
  "totalBookings": 15,
  "totalConversions": 12,
  "conversionRate": 4.8,
  "bookingsBySource": {
    "email": 15
  }
}
```

### How Leads Convert

```
Lead Created → Nurture Emails → Click Booking Link → Submit Form
                                                        ↓
                                              Lead status → "won"
                                              Booking → linked to lead & campaign
```

---

## Appendix

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Express session secret |
| `IMPORT_API_KEY` | Yes | External API authentication |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | No | OpenAI for chatbots |
| `STRIPE_SECRET_KEY` | No | Stripe payments |

### Useful Commands

```bash
# Start development
npm run dev

# Push database changes
npm run db:push

# View database (Drizzle Studio)
npm run db:studio

# Build for production
npm run build

# Start production server
npm start
```

### API Rate Limits

| Endpoint | Limit |
|----------|-------|
| Lead Import | 100/minute |
| Campaign Send | 50 emails/day (configurable) |
| General API | 1000/minute |

---

*This guide is maintained by the DentalLeadGenius team. For updates, see the repository changelog.*
