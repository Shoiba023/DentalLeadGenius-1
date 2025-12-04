# DentalLeadGenius Design Guidelines

## Design Approach

**Premium B2B SaaS Aesthetic:**
- **Reference Inspiration:** Linear's clean precision + Intercom's conversational warmth + Stripe's sophisticated restraint
- **Core Principle:** Investor-ready polish meets healthcare credibility. Every pixel should communicate premium value and data-driven results.

## Color System

**Primary Palette:**
- **Trust Blue:** Primary brand color (headers, CTAs, key UI elements) - #2563EB to #1E40AF range
- **Success Teal/Green:** Accent for growth metrics, positive states, conversion points - #14B8A6 to #10B981 range
- **Warm Neutrals:** Healthcare warmth in backgrounds - #F9FAFB, #F3F4F6, #E5E7EB
- **Dark Text:** Charcoal for readability - #111827, #1F2937

**Premium Treatments:**
- **Gradient Accents:** Blue-to-teal gradients for hero CTAs and premium cards (bg-gradient-to-r from-blue-600 to-teal-500)
- **Glass Morphism:** Semi-transparent modals with backdrop-blur-xl, border with white/10 opacity
- **Subtle Shadows:** Layered shadow-sm + shadow-lg/20 for depth without heaviness

## Typography

**Font Stack:**
- **Primary:** Inter (Google Fonts) - All UI, body text, dashboard elements
- **Headlines:** Inter Bold/Black with tight tracking for geometric precision

**Hierarchy:**
- **Hero Headlines:** text-6xl lg:text-7xl, font-black, tracking-tight, leading-tight
- **Section Headers:** text-4xl, font-bold, tracking-tight
- **Dashboard Headers:** text-2xl, font-semibold
- **Body/Chat:** text-base lg:text-lg, leading-relaxed
- **Data Labels:** text-sm, font-medium, text-gray-600
- **Metrics:** text-4xl to text-5xl, font-bold, tabular-nums

## Layout System

**Spacing Primitives:** 4, 6, 8, 12, 16, 20, 24, 32
- **Component Padding:** p-6, p-8 (cards), p-4 (compact elements)
- **Section Spacing:** py-20, py-24, py-32 (marketing), py-8, py-12 (dashboard)
- **Grid Gaps:** gap-6, gap-8, gap-12

**Container Strategy:**
- **Marketing:** max-w-7xl, mx-auto, px-6
- **Dashboard:** Full-width with max-w-screen-2xl, pl-64 (sidebar offset)
- **Content Blocks:** max-w-4xl for text-heavy areas

## Homepage Structure

**Hero Section (85vh):**
- **Layout:** Asymmetric two-column - Left 55% (content), Right 45% (premium hero image)
- **Content:** Headline emphasizing ROI ("Generate 10x More Quality Leads"), subheadline with credibility stats, gradient CTA button row (WhatsApp, SMS, Demo Request)
- **Image:** High-quality professional dental clinic imagery, rounded-2xl, shadow-2xl with subtle gradient overlay
- **CTA Buttons:** Gradient primary button + glass-morphism secondary buttons with backdrop-blur-md

**Value Proposition (3-column grid):**
- **Premium stat cards** with gradient borders, large numbers (text-5xl), growth indicators with teal accents
- Each card: Icon, metric, percentage growth, micro-sparkline visualization

**Features Section (Staggered 2-column):**
- **Alternating image-content layout** for 3 core features (AI Chatbot, Lead Management, Multi-Clinic)
- Feature cards with subtle shadow-lg, hover:shadow-xl transition
- Icons using Heroicons with gradient backgrounds (rounded-xl, p-3)

**Social Proof (Split layout):**
- Left 60%: Testimonial cards in masonry grid with clinic logos, quotes, results metrics
- Right 40%: Vertical stats stack with animated number counters, trust badges

**Premium Demo CTA:**
- Full-width section with gradient background (blue-to-teal)
- Glass-morphism form card centered, backdrop-blur-xl, white text on gradient
- Headline + 2-column mini-form (email + phone) with gradient submit button

## Dashboard Interface

**Sidebar Navigation:**
- **Fixed left, w-64,** gradient background (subtle blue-gray), white text
- Logo at top with glow effect, menu items with icons (Heroicons), active state with teal accent border-left
- User profile card at bottom with avatar, name, role badge

**Main Content Area:**
- **Top Stats Bar:** 4-column grid of gradient metric cards, each with icon, large number, trend arrow, mini-sparkline
- **Data Table:** Premium styling with alternating row backgrounds, sticky header with shadow, status badges with gradient backgrounds
- **Filters:** Glass-morphism filter bar above table with dropdown selects and search input with gradient focus ring

**Lead Detail Modal:**
- **Glass morphism overlay** with backdrop-blur-md
- Content card: rounded-2xl, shadow-2xl, white background
- Header with gradient accent, profile section, timeline of interactions, action buttons with gradients

## Chatbot Widget

**Collapsed State:**
- **Fixed bottom-right** (bottom-8, right-8), circular button (w-20 h-20) with gradient background
- Pulse animation ring, notification badge with count

**Expanded (w-[400px] h-[650px]):**
- **Card:** rounded-3xl, shadow-2xl with glass-morphism header
- **Header:** Gradient background, AI avatar with glow effect, "Sarah - Lead Specialist" text, green status dot
- **Messages:** User bubbles with gradient backgrounds (right), bot messages with light gray (left), avatar thumbnails
- **Input Bar:** Glass-morphism sticky bottom, rounded-full input, gradient send button
- **Auto-open:** Slide-up animation after 3s with subtle bounce

## Clinic Subpages

**Patient-Facing Layout:**
- **Header:** Transparent-to-solid on scroll, clinic logo, navigation with gradient hover states, "Book Now" gradient CTA
- **Hero Banner:** Full-width clinic image with gradient overlay, large headline, services badges in horizontal scroll
- **Services Grid:** 3-column premium cards with service icons, descriptions, "Learn More" links with teal accent
- **Branded Chatbot:** Same widget design with clinic's custom gradient colors

## Premium Component Library

**Buttons:**
- **Primary Gradient:** bg-gradient-to-r from-blue-600 to-teal-500, rounded-lg, px-8, py-4, shadow-lg, hover:shadow-xl
- **Glass Secondary:** backdrop-blur-md, border white/20, hover:bg-white/10
- **Icon Buttons:** Rounded-full with gradient on hover

**Cards:**
- **Premium:** rounded-2xl, shadow-lg, border border-gray-100, hover:shadow-2xl transition-all duration-300
- **Stat Cards:** Gradient borders (border-2), large numbers with tabular-nums, mini-visualizations
- **Feature Cards:** Image at top (rounded-t-2xl), content p-8, gradient accent line at bottom

**Form Inputs:**
- **Fields:** rounded-xl, px-4, py-3, border-2, focus:ring-4 with blue/20 ring, focus:border-blue-500
- **Labels:** text-sm, font-semibold, mb-2, text-gray-700
- **Validation:** Inline messages with icons, teal for success, red for errors

**Badges:**
- **Status:** Gradient backgrounds for Won/Contacted, rounded-full, px-4, py-1.5, text-xs, font-bold, shadow-sm
- **Trust Badges:** Logo + text in glass-morphism containers

## Micro-Animations

**Strategic Premium Polish:**
- **Card Entrance:** Stagger fade-up on scroll (100ms delays), 400ms duration
- **Metric Counters:** Animated number roll-up on viewport entry
- **Hover States:** Scale(1.02) + shadow enhancement, 200ms ease-out
- **Gradient Shifts:** Subtle gradient position animation on hover for CTAs
- **Loading States:** Gradient shimmer effect for skeleton screens
- **Modal Transitions:** Backdrop fade + content scale-up (300ms)

## Images

**Hero Section:**
- **Primary Hero Image:** Professional dental office or dentist-patient interaction, bright and inviting, placed right 45% of hero, rounded-2xl, shadow-2xl

**Feature Sections:**
- **Alternating feature images:** Screenshot mockups of dashboard, chatbot interface, lead management views - high-fidelity, with subtle gradient overlays

**Clinic Subpages:**
- **Full-width hero banner:** Each clinic's office/team photo with gradient overlay for text contrast

**Social Proof:**
- **Clinic logos** in testimonial cards, grayscale with color on hover

**Icons:** Heroicons exclusively via CDN for all UI elements

## Accessibility

- **Focus Rings:** ring-4 ring-blue-500/20 with ring-offset-2 for keyboard navigation
- **Contrast:** All text meets WCAG AA against backgrounds, special attention to gradient text
- **Form Labels:** Always visible above inputs, never placeholder-only
- **ARIA:** Proper labels for icon buttons, status indicators, and interactive elements