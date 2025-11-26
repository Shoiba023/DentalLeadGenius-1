# DentalLeadGenius Design Guidelines

## Design Approach

**Hybrid Strategy:**
- **Marketing/Patient Areas:** Inspired by Linear (clean B2B SaaS aesthetic) + Intercom (conversational UI patterns)
- **Admin Dashboard:** Tailwind UI conventions for data-dense interfaces
- **Core Principle:** Professional healthcare credibility meets modern SaaS approachability

## Typography

**Font Stack:**
- Primary: Inter (Google Fonts) - body text, UI elements, chat messages
- Accent: Cal Sans (or Lexend) - headlines, hero text
  
**Hierarchy:**
- Hero Headlines: text-5xl to text-7xl, font-bold
- Section Headers: text-3xl to text-4xl, font-semibold
- Body/Chat: text-base to text-lg, font-normal
- Labels/Metadata: text-sm, font-medium
- Micro-copy: text-xs

## Layout System

**Spacing Units:** Consistent use of 4, 6, 8, 12, 16, 20, 24, 32
- Component padding: p-4, p-6, p-8
- Section spacing: py-16, py-20, py-24
- Element gaps: gap-4, gap-6, gap-8

**Grid Structure:**
- Marketing sections: max-w-7xl centered containers
- Admin dashboard: full-width with max-w-screen-2xl
- Content areas: max-w-4xl for readability
- Responsive: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Homepage Structure

**Hero Section (80vh):**
- Two-column layout: Left (60%) - headline, subheadline, 3 contact buttons (WhatsApp, SMS, Demo); Right (40%) - hero image
- Headline emphasizes lead generation results ("Generate 10x More Quality Dental Leads")
- Contact buttons in horizontal row: rounded-lg, px-6, py-3, with blur backdrop for image overlay

**Features Section:**
- 3-column grid showcasing: AI Chatbot, Lead Management, Multi-Clinic Platform
- Each card: icon (top), title, description, subtle hover lift effect

**Social Proof:**
- 2-column layout: testimonials (left 2/3) + stats/metrics cards (right 1/3)
- Stats in vertical stack: number + label format

**Demo CTA Section:**
- Centered, single-column, py-24
- Prominent call-to-action with demo booking trigger

## Chatbot Widget

**Visual Design:**
- Fixed bottom-right: bottom-6, right-6
- Collapsed: Circular button (w-16 h-16) with chat icon + notification dot
- Expanded: Card (w-96 h-[600px]) with rounded-2xl, shadow-2xl
- Header: Gradient background, avatar + "Sarah - Dental Lead Specialist" + status dot
- Message area: Scrollable, px-4, py-2 spacing between messages
- User messages: Right-aligned, rounded-2xl bubbles
- Bot messages: Left-aligned with avatar thumbnail
- Input: Sticky bottom, rounded-full input with send button

**Auto-open Behavior:** Slides up from bottom-right after 2.5s page load

## Admin Dashboard

**Navigation:**
- Sidebar (fixed left, w-64): Logo top, menu items with icons, user profile bottom
- Main content: pl-64, full height, bg-gray-50

**Lead Table:**
- Data table with sticky header
- Columns: Checkbox, Name, Email, Phone, State, Status (badge), Actions (dropdown)
- Row hover: Subtle background change
- Filters bar above table: Search input + dropdown filters (state, status)
- Pagination below table

**Analytics Cards:**
- 4-column grid of metric cards
- Each card: Large number (text-4xl), label below, icon accent, trend indicator

## Clinic Subpages

**Patient-Facing Layout:**
- Header: Clinic logo (left), clinic name, navigation links, "Book Appointment" CTA
- Hero: Full-width banner with clinic photo, headline, services overview
- Services Section: 2-3 column grid of dental services
- Chatbot widget: Same design as homepage but branded with clinic colors
- Footer: Clinic contact info, hours, location map embed

## Component Library

**Buttons:**
- Primary: Solid background, rounded-lg, font-medium, hover:opacity-90
- Secondary: Border variant, transparent background
- Icon buttons: Square or circular, p-2 to p-3

**Forms:**
- Input fields: rounded-lg, px-4, py-3, border, focus:ring-2
- Labels: text-sm, font-medium, mb-2
- Inline validation messages below inputs

**Cards:**
- Standard: rounded-xl, shadow-sm, p-6, border
- Hover cards: Add shadow-md transition on hover
- Stat cards: Highlight numbers with large text, subtle background

**Badges:**
- Status indicators: rounded-full, px-3, py-1, text-xs, font-semibold
- Colors mapped to status (not specified now, but structure for New/Contacted/Won/Lost)

**Modals:**
- Overlay: Semi-transparent backdrop
- Content: Centered card, max-w-lg, rounded-2xl, p-8
- Close button: Absolute top-right

## Images

**Hero Image (Homepage):** 
Professional dental clinic office or happy dentist-patient interaction, high-quality photography, placed right side of hero section (40% width), rounded-2xl with subtle shadow

**Clinic Subpage Header:**
Each clinic's branded hero image showing their office/team, full-width background with overlay gradient for text readability

**Feature Icons:**
Use Heroicons (via CDN) for all UI icons - chat, calendar, users, chart-bar, etc.

## Animations

**Minimal, Strategic Use:**
- Chatbot entrance: Slide-up with fade (300ms ease-out)
- Card hovers: Subtle scale/shadow transition (200ms)
- Page transitions: Fade between dashboard views (150ms)
- Loading states: Subtle spinner only where necessary

**No distracting scroll animations or parallax effects**

## Accessibility

- Form labels always visible, not placeholders only
- Sufficient contrast ratios throughout
- Focus states: ring-2 ring-offset-2 for keyboard navigation
- ARIA labels for icon-only buttons