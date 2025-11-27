# ai-gurus-lms UX Design Specification

_Created on 2025-11-24 by Ed_
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

The AI Gurus LMS is a production-grade learning management system designed to deliver professional AI fluency education to SME executive decision-makers. This platform enables the strategic bundled offering of AI Readiness Assessment + Fluency Program, positioning AI Gurus as a complete AI transformation partner rather than just an assessment vendor.

**Project Vision:** Transform the AI Gurus LMS from a development prototype into a production-grade learning platform capable of supporting 1-10 beta testers in Q1 2026, with a clear path to scaling beyond 100+ users. The platform focuses on teaching AI leadership and decision-making—not just tool usage—helping executives make informed decisions about when, how, and why to implement AI in their organizations.

**Target Users:**
- **Primary:** SME executive decision-makers (C-suite, VPs, Directors) responsible for AI strategy
  - Pain points: Decision paralysis, misinformation about AI costs/capabilities, build vs. buy confusion
  - Goals: Make informed AI implementation decisions, evaluate solutions critically, understand when AI is appropriate

- **Secondary:** Instructors delivering AI fluency curriculum
  - Pain points: Limited by manual processes, need programmatic tracking and automation
  - Goals: Efficient course management, streamlined grading, visibility into student progress

- **Secondary:** Platform administrators managing program operations
  - Pain points: No centralized management, manual processes, limited visibility
  - Goals: Centralized user/course management, automated reporting, system health monitoring

**Core Platform Requirements:**
- **Platform:** Responsive web application (desktop primary, mobile/tablet secondary)
- **Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Radix UI components
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- **Accessibility:** WCAG 2.1 AA compliance (Radix UI provides foundation)

**Project Context:**
- **Project Level:** Level 3 Brownfield (existing codebase: 88 TypeScript files, 42 API endpoints, 10 database models)
- **Timeline:** Q1 2026 beta launch (3-month development window)
- **Business Goal:** Enable bundled AI Readiness Assessment + Fluency offering to achieve competitive parity
- **Success Metrics:** 80%+ beta tester satisfaction, 99.5%+ uptime, zero critical security incidents

---

## 3. Visual Foundation

### 3.1 Color System

**Selected Theme: "Strategic Authority with Warmth"** (Hybrid of Theme 3 + Theme 4)

This color system combines professional authority (navy) with human warmth (orange) and strategic premium positioning (purple). It conveys "we're serious about AI strategy, but approachable"—executive-level without intimidation.

**Interactive Color Explorer:** [ux-color-themes.html](./ux-color-themes.html)

#### Primary Colors

**Navy Primary** `#1e293b`
- **Usage:** Headers, main navigation, footer, authority elements, section backgrounds
- **Psychology:** Professional, authoritative, trustworthy—executive-level credibility
- **Application:** Student/Instructor/Admin dashboard headers, course detail headers, major section dividers

**Warm Orange** `#f97316`
- **Usage:** Primary CTAs, key action buttons, active states, focus indicators
- **Psychology:** Energy, approachability, action-oriented—removes intimidation from corporate navy
- **Application:** "Enroll Now", "Submit Assignment", "Save Grade", primary interactive elements

**Strategic Purple** `#7c3aed`
- **Usage:** Premium highlights, achievement moments, special features
- **Psychology:** Strategic depth, creativity, wisdom—leadership and innovation
- **Application:** Certificate badges, course completion celebrations, grade notifications, premium features

#### Secondary Colors

**Tech Slate** `#334155`
- **Usage:** Secondary navigation, supporting elements, card headers
- **Psychology:** Modern, tech-credible, stable
- **Application:** Sidebar navigation, secondary buttons, card backgrounds with content

**Soft Orange** `#fb923c`
- **Usage:** Hover states for orange buttons, secondary CTAs, less critical actions
- **Application:** Button hover effects, secondary action buttons, tertiary navigation

#### Semantic Colors

**Success Green** `#22c55e`
- **Usage:** Assignment submitted, grade received (positive), module completed, success alerts
- **Application:** Toast notifications for successful actions, status badges, progress indicators

**Warning Amber** `#f59e0b`
- **Usage:** Due soon, pending review, attention needed (non-critical)
- **Application:** Assignment due reminders, pending grading status, incomplete profile warnings

**Error Red** `#ef4444`
- **Usage:** Form validation errors, overdue assignments, critical issues, failed submissions
- **Application:** Inline form errors, overdue assignment badges, critical system alerts

**Info Blue** `#3b82f6`
- **Usage:** Informational messages, help text, supplementary information
- **Application:** Info tooltips, announcement banners, neutral notifications

#### Neutral Palette

**Text Primary** `#0f172a` (Dark Navy)
- **Usage:** Headings (h1-h6), emphasized text, high-contrast body text
- **Contrast Ratio:** 14.5:1 on white (AAA compliance)

**Text Secondary** `#64748b` (Slate Gray)
- **Usage:** Body text, descriptions, less emphasized content, metadata
- **Contrast Ratio:** 7.2:1 on white (AA compliance)

**Text Tertiary** `#94a3b8` (Light Slate)
- **Usage:** Placeholder text, disabled states, de-emphasized content
- **Contrast Ratio:** 4.6:1 on white (AA compliance for large text)

**Background Primary** `#fafafa` (Soft White)
- **Usage:** Page background, main content area
- **Why not pure white:** Reduces eye strain, provides subtle depth for white cards

**Background Secondary** `#ffffff` (Pure White)
- **Usage:** Cards, modals, elevated surfaces, content containers

**Background Tertiary** `#f8fafc` (Cool White)
- **Usage:** Alternate row backgrounds (tables), subtle section differentiation

**Borders & Dividers** `#e2e8f0` (Light Slate)
- **Usage:** Card borders, input borders, table borders, dividers between sections

**Hover/Focus Backgrounds** `rgba(249, 115, 22, 0.1)` (10% Orange)
- **Usage:** Hover states for interactive elements, focus backgrounds for inputs

#### Color Usage Matrix

| Element Type | Default State | Hover/Active | Disabled |
|--------------|---------------|--------------|----------|
| **Primary Button** | Orange `#f97316` | Soft Orange `#fb923c` | Light Gray `#e2e8f0` |
| **Secondary Button** | Navy `#1e293b` | Lighter Navy `#334155` | Light Gray `#e2e8f0` |
| **Text Link** | Orange `#f97316` | Underline + darker | Gray `#94a3b8` |
| **Navigation Active** | Purple `#7c3aed` | Purple gradient | N/A |
| **Input Border** | Border `#e2e8f0` | Orange `#f97316` (2px) | Gray `#cbd5e1` |
| **Card** | White on `#fafafa` | Lift shadow (0 4px 8px) | N/A |

#### Accessibility Compliance

All color combinations meet **WCAG 2.1 AA standards** for contrast:
- Text Primary on Background: 14.5:1 (AAA)
- Text Secondary on Background: 7.2:1 (AA)
- Orange buttons with white text: 4.8:1 (AA for large text)
- Navy backgrounds with white text: 12.1:1 (AAA)

**Color Blindness Considerations:**
- Semantic colors (success/warning/error) use icons in addition to color
- Orange and purple are distinguishable for most color blind users
- Never rely on color alone to convey information

### 3.2 Typography System

**Font Stack** (Tailwind CSS 4 Default System Fonts)
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

**Rationale:** System fonts provide excellent readability, fast loading (no web font download), and native feel on each platform. For a professional LMS, clarity and speed outweigh custom typography.

**Alternative Consideration:** If brand requires more personality, consider Inter or IBM Plex Sans (both have excellent readability and professional feel).

#### Type Scale (Tailwind CSS 4)

**Headings:**
- `h1`: 36px (2.25rem) / Bold (700) / Line-height 1.2 / Letter-spacing -0.025em
  - Usage: Page titles ("Student Dashboard", "Course: AI Strategy")
- `h2`: 30px (1.875rem) / Bold (700) / Line-height 1.3 / Letter-spacing -0.02em
  - Usage: Section headers ("Your Courses", "Upcoming Assignments")
- `h3`: 24px (1.5rem) / Semibold (600) / Line-height 1.4
  - Usage: Card titles, module headers
- `h4`: 20px (1.25rem) / Semibold (600) / Line-height 1.5
  - Usage: Subsection headers, assignment titles
- `h5`: 18px (1.125rem) / Medium (500) / Line-height 1.5
  - Usage: Labels, form section headers
- `h6`: 16px (1rem) / Medium (500) / Line-height 1.5
  - Usage: Smallest headers, metadata labels

**Body Text:**
- **Large Body**: 18px (1.125rem) / Regular (400) / Line-height 1.75
  - Usage: Primary content in course materials, assignment descriptions
- **Base Body**: 16px (1rem) / Regular (400) / Line-height 1.625
  - Usage: Standard body text, form descriptions, card content
- **Small Body**: 14px (0.875rem) / Regular (400) / Line-height 1.6
  - Usage: Secondary information, metadata, timestamps, helper text
- **Tiny**: 12px (0.75rem) / Regular (400) / Line-height 1.5
  - Usage: Labels, badges, minimal text

**Font Weights:**
- **Bold (700)**: H1, H2, strong emphasis
- **Semibold (600)**: H3, H4, button text, navigation
- **Medium (500)**: H5, H6, labels
- **Regular (400)**: All body text, descriptions
- **Light (300)**: Avoid (poor accessibility with gray text)

#### Typography Usage Patterns

**Dashboard Titles:**
- Page title (h1): "Welcome back, Ed" - 36px Bold Navy
- Section headers (h2): "Your Courses" - 30px Bold Navy
- Card titles (h3): "AI Strategy Fundamentals" - 24px Semibold Navy

**Course Content:**
- Module title (h2): "Module 3: Build vs Buy Decisions" - 30px Bold
- Section (h3): "Evaluating AI Vendors" - 24px Semibold
- Content (p): 18px Regular (larger for readability during learning)

**Forms & Inputs:**
- Field label (h5 or label): 16px Medium Navy
- Input text: 16px Regular (prevents zoom on mobile)
- Helper text: 14px Small Slate
- Error messages: 14px Small Red

**Navigation:**
- Main nav items: 16px Semibold
- Active state: 16px Semibold Purple (with underline or background)

### 3.3 Spacing & Layout System

**Base Unit:** 4px (Tailwind's default spacing scale)

**Spacing Scale:**
- `xs`: 4px (0.25rem) - Tight spacing, icon gaps
- `sm`: 8px (0.5rem) - Small gaps, compact layouts
- `md`: 16px (1rem) - Default spacing between elements
- `lg`: 24px (1.5rem) - Section spacing, card padding
- `xl`: 32px (2rem) - Large section gaps
- `2xl`: 48px (3rem) - Major section dividers
- `3xl`: 64px (4rem) - Page-level spacing

**Component Padding Standards:**
- **Buttons:** `py-3 px-6` (12px vertical, 24px horizontal)
- **Cards:** `p-6` (24px all sides)
- **Modals:** `p-8` (32px all sides)
- **Page Container:** `px-6 py-8` (24px horizontal, 32px vertical)
- **Form Inputs:** `py-2.5 px-4` (10px vertical, 16px horizontal)

**Layout Grid:**
- **System:** CSS Grid / Flexbox (no rigid 12-column constraint)
- **Container Max Width:** 1280px (Tailwind `max-w-7xl`)
- **Content Max Width:** 768px for readable text (Tailwind `max-w-3xl`)
- **Dashboard:** Flexible grid adapting to content needs
- **Gap Between Cards:** 24px (1.5rem)

**Responsive Breakpoints** (Tailwind CSS 4 defaults):
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet portrait)
- `lg`: 1024px (tablet landscape / small desktop)
- `xl`: 1280px (desktop)
- `2xl`: 1536px (large desktop)

**Responsive Spacing Strategy:**
- Mobile: Reduce padding by 25-50% (e.g., card `p-6` → `p-4` on mobile)
- Tablet: Standard spacing
- Desktop: Standard or slightly increased for larger screens

**Border Radius Standards:**
- **Small:** 4px (`rounded`) - Badges, small buttons
- **Medium:** 6px (`rounded-md`) - Buttons, inputs, small cards
- **Large:** 8px (`rounded-lg`) - Cards, modals, major containers
- **XLarge:** 12px (`rounded-xl`) - Hero sections, featured content
- **Full:** 9999px (`rounded-full`) - Avatars, pills, circular badges

**Shadow System** (Depth Hierarchy):
- **Level 0:** None - Flat elements, backgrounds
- **Level 1:** `shadow-sm` (0 1px 2px) - Subtle lift, inputs
- **Level 2:** `shadow` (0 2px 4px) - Default cards
- **Level 3:** `shadow-md` (0 4px 6px) - Elevated cards, hover states
- **Level 4:** `shadow-lg` (0 10px 15px) - Modals, dropdowns
- **Level 5:** `shadow-xl` (0 20px 25px) - Floating action buttons, major emphasis

**Visual Foundation Summary:**

This color system, typography, and spacing framework creates:
- **Professional credibility** through navy authority and refined typography
- **Human approachability** through warm orange accents and generous spacing
- **Strategic depth** through purple premium touches
- **Modern clarity** through system fonts and clean spacing
- **Accessibility** through WCAG AA+ compliance and readable type scale

All decisions are optimized for executive users who expect polish, instructors who need efficiency, and administrators who need clarity.

---

## 4. Key Screen Designs

This section defines the layout, information hierarchy, and interactions for the most critical screens in the AI Gurus LMS. Each screen design applies the visual foundation (colors, typography, spacing) and core experience principles (speed, clarity, standards, feedback).

### 4.1 Screen Design Priority

Based on user journeys and technical requirements, these screens are prioritized:

**Priority 1 (Critical Path):**
1. **Student Dashboard** - First impression, course access point, progress visibility
2. **Instructor Gradebook** - THE critical interface (30% efficiency target, current blocker)
3. **Course Detail Page** - Where learning happens (tabbed interface pattern)

**Priority 2 (Core Functionality):**
4. **Assignment Submission Interface** - Student workflow completion
5. **Instructor Grading Interface** - Feedback delivery workflow
6. **Course Catalog** - Enrollment entry point

**Priority 3 (Administrative):**
7. **Admin Dashboard** - System health and operations
8. **User Management** - Admin workflow efficiency

We'll design Priority 1 screens in detail, then outline Priority 2-3 screens.

---

### 4.2 Student Dashboard

**Purpose:** Home base for SME executive learners. Provides immediate access to active courses, upcoming assignments, recent grades, and progress visibility. Sets professional tone and demonstrates clarity over complexity.

**User Goals:**
- Resume learning quickly (one-click access to where I left off)
- See what's due soon (upcoming assignments, deadlines)
- Track progress (course completion, grades)
- Feel motivated (progress visibility, achievement moments)

**Design Principles Applied:**
- **Speed Over Ceremony:** One-click "Resume Course" buttons
- **Guidance Through Clarity:** Clear next actions, no hunting
- **Progress Visibility:** Inspired by Coursera's dashboard approach

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [HEADER - Navy #1e293b]                                          │
│  AI Gurus LMS Logo    [Dashboard] [Courses] [Profile ▼]         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Page Container (max-w-7xl, px-6 py-8)                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Welcome Section                                             │ │
│  │ h1: "Welcome back, Ed" (36px Bold Navy)                     │ │
│  │ p: "Continue your AI leadership journey" (16px Slate)      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ h2: "Continue Learning" (30px Bold Navy)                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [3-Column Grid - Gap: 24px]                                    │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐│
│  │ COURSE CARD      │ │ COURSE CARD      │ │ COURSE CARD      ││
│  │ [White bg]       │ │ [White bg]       │ │ [White bg]       ││
│  │                  │ │                  │ │                  ││
│  │ Course Title     │ │ Course Title     │ │ Course Title     ││
│  │ Progress: 65%    │ │ Progress: 32%    │ │ Progress: 100%   ││
│  │ [Progress Bar    │ │ [Progress Bar]   │ │ [✓ Complete]     ││
│  │  Orange gradient]│ │                  │ │                  ││
│  │                  │ │ Next: Module 2   │ │ Grade: 92%       ││
│  │ Next: Assignment │ │                  │ │                  ││
│  │ 3 (Due Nov 30)   │ │ [Resume Course]  │ │ [View Cert]      ││
│  │                  │ │ Orange button    │ │ Purple button    ││
│  │ [Resume Course]  │ │                  │ │                  ││
│  │ Orange button    │ │                  │ │                  ││
│  └──────────────────┘ └──────────────────┘ └──────────────────┘│
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ h2: "Upcoming Assignments" (30px Bold Navy)                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Table/List - White card with subtle borders]               │ │
│  │                                                              │ │
│  │ Assignment Title               Course           Due    Action│
│  │ ────────────────────────────────────────────────────────────│ │
│  │ Build vs Buy Analysis      AI Strategy      Nov 30  [Submit]│
│  │ (Due in 2 days - Warning amber badge)                       │ │
│  │                                                              │ │
│  │ Vendor Evaluation Report   Implementation   Dec 7   [View] │
│  │                                                              │ │
│  │ Implementation Roadmap     Leadership       Dec 15  [View] │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [2-Column Grid - Gap: 24px]                                    │
│  ┌──────────────────────────────┐ ┌──────────────────────────┐ │
│  │ h2: "Recent Grades"          │ │ h2: "Announcements"       │ │
│  │                              │ │                           │ │
│  │ Module 2 Quiz: 88%           │ │ 📢 Beta Program Launch    │ │
│  │ Assignment 2: 92% (A)        │ │    Week begins Dec 1      │ │
│  │ Instructor: "Excellent       │ │                           │ │
│  │ strategic analysis..."       │ │ 📢 Office Hours: Wed 2pm  │ │
│  │                              │ │                           │ │
│  │ [View All Grades]            │ │ [View All →]              │ │
│  └──────────────────────────────┘ └──────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Component Specifications

**Course Cards:**
- **Size:** Min-height 280px, flexible width (3-column grid on desktop, 1-column on mobile)
- **Background:** White (#ffffff) on #fafafa page background
- **Border:** 1px solid #e2e8f0
- **Border Radius:** 8px (rounded-lg)
- **Shadow:** shadow-md on hover (0 4px 6px)
- **Padding:** p-6 (24px all sides)

**Card Content Hierarchy:**
1. **Course Title** (h3): 24px Semibold Navy - Truncate after 2 lines
2. **Progress Bar:** 8px height, rounded, orange gradient (#f97316 → #fb923c), background #e2e8f0
3. **Progress Text:** "Progress: 65%" - 14px Medium Slate above bar
4. **Next Action:** "Next: Assignment 3 (Due Nov 30)" - 14px Regular Slate with warning badge if <3 days
5. **CTA Button:** "Resume Course" - Orange (#f97316), white text, py-3 px-6, full width

**Completed Course Card (Variant):**
- Purple accent instead of orange
- "✓ Complete" badge (Success green background)
- "Grade: 92%" display
- "View Certificate" button (Purple gradient)

**Upcoming Assignments Table:**
- **Container:** White card, p-6, border 1px #e2e8f0
- **Rows:** Hover state with #fafafa background
- **Columns:** Assignment | Course | Due Date | Action
- **Due Date Badges:**
  - <3 days: Warning amber (#f59e0b) background, "Due in X days"
  - Overdue: Error red (#ef4444) background, "Overdue"
  - Normal: Text only, no badge

**Recent Grades Section:**
- **Container:** White card, p-6
- **List Items:** Each grade entry with:
  - Assignment name: 16px Semibold Navy
  - Grade: 20px Bold (color-coded: A=Green, B=Amber, C+=Orange)
  - Instructor feedback snippet: 14px Regular Slate, italic, truncated to 2 lines
  - "Read more" link if truncated

**Responsive Behavior:**
- **Desktop (1280px+):** 3-column course cards, 2-column bottom sections
- **Tablet (768px-1279px):** 2-column course cards, 1-column bottom sections
- **Mobile (<768px):** 1-column everything, reduce card padding to p-4

#### Interaction Patterns

**Primary Actions:**
1. **Resume Course Button:**
   - Click → Navigate to last accessed module/lesson in course
   - State saved server-side (not browser-based)
   - Loading state: Button text changes to "Loading..." with spinner

2. **Assignment Submit Link:**
   - Click → Navigate to assignment submission page
   - Badge shows urgency (color-coded by days remaining)

3. **Course Card Hover:**
   - Lift with shadow-md
   - Subtle scale (1.02)
   - Transition: 200ms ease

**Secondary Actions:**
- "View All Grades" → Navigate to full gradebook page
- "View All Announcements" → Navigate to announcements page
- Course card click (anywhere except button) → Navigate to course detail page

**Empty States:**
- **No Active Courses:**
  - Illustration + "Ready to start your AI leadership journey?"
  - [Browse Courses] button (Orange)
- **No Assignments:**
  - "You're all caught up! No assignments due."
  - Success green checkmark icon

**Success States:**
- **Course Completed:** Purple celebration badge, confetti animation (subtle, one-time)
- **All Assignments Complete:** Green success message

#### Information Architecture Rationale

**Why This Layout:**
1. **Welcome + Continue Learning First:** Immediate action (resume course) reduces friction—no scrolling to find where you left off
2. **Progress Visibility:** Course cards show completion % inspired by Coursera—executives need ROI visibility
3. **Upcoming Assignments Prominent:** Prevents surprises, aligns with "Guidance Through Clarity" principle
4. **Recent Grades for Motivation:** Positive feedback loop, shows instructor engagement
5. **Announcements Secondary:** Important but not primary workflow

**Mobile Optimization:**
- Stack everything vertically (no information loss)
- Course cards remain full-featured (not simplified)
- Sticky CTA: "Resume Course" button sticky at bottom for quick access on mobile

---

### 4.3 Instructor Gradebook (THE Critical Interface)

**Purpose:** Enable instructors to efficiently grade multiple students across multiple assignments with inline editing. This is THE most critical UX to get right—directly impacts 30% efficiency goal vs. Notion, currently incomplete in codebase.

**User Goals:**
- View all students × assignments at a glance (grid/matrix view)
- Grade assignments inline without modal dialogs (speed over ceremony)
- Batch operations (grade multiple students on same assignment quickly)
- Track who's submitted, who's pending, who's overdue
- Navigate to detailed grading view for complex feedback

**Design Principles Applied:**
- **Speed Over Ceremony:** Inline editing, keyboard shortcuts, auto-save
- **Flexibility Through Standards:** Excel/Google Sheets mental model (familiar grid)
- **Efficient Feedback:** Toast notifications, not modal interruptions

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [HEADER - Navy #1e293b]                                          │
│  AI Gurus LMS Logo    [Dashboard] [Courses] [Gradebook] [▼]     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Page Container (max-w-full, px-6 py-8 - wider for grid)         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Breadcrumb: Home > Courses > AI Strategy Fundamentals       │ │
│  │ h1: "Gradebook: AI Strategy Fundamentals" (36px Bold Navy)  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Toolbar - White card, p-4, flex justify-between]           │ │
│  │                                                              │ │
│  │ [Filter: All Students ▼] [Assignment: All ▼]                │ │
│  │                                                              │ │
│  │ [Export CSV] [Auto-save: On ✓] [Keyboard Shortcuts →]      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Gradebook Grid - White card, overflow-x: auto]             │ │
│  │                                                              │ │
│  │ ┌──────────┬─────────┬─────────┬─────────┬─────────┬──────┐ │
│  │ │Student   │Assign 1 │Assign 2 │Assign 3 │ Quiz 1  │Final │ │
│  │ │Name      │(10 pts) │(15 pts) │(20 pts) │(10 pts) │Grade │ │
│  │ ├──────────┼─────────┼─────────┼─────────┼─────────┼──────┤ │
│  │ │Alice C.  │  [92]   │  [88]   │  [--]   │   [95]  │ 91.7%│ │
│  │ │          │  A      │  B+     │ Pending │   A     │  A   │ │
│  │ │          │   ✓     │   ✓     │ [Grade] │   ✓     │      │ │
│  │ ├──────────┼─────────┼─────────┼─────────┼─────────┼──────┤ │
│  │ │Bob D.    │  [85]   │  [--]   │  [--]   │   [78]  │ 81.5%│ │
│  │ │          │  B      │ Missing │ Pending │   C+    │  B-  │ │
│  │ │          │   ✓     │ ⚠ 2d    │ [Grade] │   ✓     │      │ │
│  │ ├──────────┼─────────┼─────────┼─────────┼─────────┼──────┤ │
│  │ │Carol E.  │  [95]   │  [92]   │ [Input] │  [100]  │ 95.7%│ │
│  │ │          │  A      │  A      │ *EDIT*  │   A+    │  A   │ │
│  │ │          │   ✓     │   ✓     │ [Save]  │   ✓     │      │ │
│  │ ├──────────┼─────────┼─────────┼─────────┼─────────┼──────┤ │
│  │ │David F.  │  [88]   │  [90]   │  [--]   │ [OVER]  │ 89.0%│ │
│  │ │          │  B+     │  A-     │ Pending │ Overdue │  B+  │ │
│  │ │          │   ✓     │   ✓     │ [Grade] │  ⚠      │      │ │
│  │ └──────────┴─────────┴─────────┴─────────┴─────────┴──────┘ │
│  │                                                              │ │
│  │ [12 more students...]                                        │ │
│  │                                                              │ │
│  │ [Load More] or [Pagination: 1 2 3 ... 10]                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Summary Stats - 2-column cards]                            │ │
│  │ ┌───────────────────────┐ ┌───────────────────────────┐    │ │
│  │ │ Pending Submissions   │ │ Average Grade             │    │ │
│  │ │ 8 assignments         │ │ 87.3% (B+)                │    │ │
│  │ │ [Review →]            │ │ [View Distribution →]     │    │ │
│  │ └───────────────────────┘ └───────────────────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Component Specifications

**Grid Container:**
- **Background:** White card with shadow
- **Overflow:** Horizontal scroll on smaller screens (sticky first column: student names)
- **Cell Padding:** p-3 (12px) for clickability
- **Border:** 1px solid #e2e8f0 between cells

**Grid Cell States:**

1. **Graded (Complete):**
   - Score: 20px Bold Navy in square brackets `[92]`
   - Letter Grade: 14px Medium Slate below score `A`
   - Checkmark: Green ✓ icon (indicates saved)
   - Background: White
   - Click behavior: Open detailed grading view in slide-over panel

2. **Edit Mode (Active):**
   - Input field: 16px text input, border 2px Orange (#f97316)
   - Background: Soft orange tint (#fff7ed)
   - [Save] button: Small orange button below input
   - [Cancel] link: Small slate text
   - Auto-save: 2 seconds after last keystroke
   - Keyboard: Enter to save, Esc to cancel, Tab to next cell

3. **Pending Submission:**
   - Text: "Pending" 14px Regular Slate
   - [Grade] button: Small navy button
   - Click: Navigate to assignment submission (if submitted) or show "Not submitted" message
   - Background: Light gray tint (#f8f9fa)

4. **Missing/Not Submitted:**
   - Text: "Missing" 14px Regular slate
   - Warning badge: "⚠ 2d" (overdue by 2 days) - Amber if <7 days, Red if 7+ days
   - Click: Show submission details or send reminder option

5. **Overdue:**
   - Text: "Overdue" 14px Bold Red
   - Background: Light red tint (#fef2f2)
   - Warning icon: ⚠ Red

**Keyboard Shortcuts:**
- **Tab:** Move to next cell (left to right, top to bottom)
- **Shift+Tab:** Move to previous cell
- **Enter:** Start editing current cell / Save if editing
- **Esc:** Cancel edit, revert to previous value
- **Ctrl+S / Cmd+S:** Manual save all pending changes
- **Arrow Keys:** Navigate grid (when not in edit mode)

**Auto-Save Behavior:**
- **Trigger:** 2 seconds after last keystroke in input field
- **Feedback:** Subtle toast notification (2s auto-dismiss): "Grade saved for Carol E. - Assignment 3"
- **Error Handling:** If save fails, show persistent toast: "Failed to save. [Retry] [Cancel]"
- **Visual Indicator:** Checkmark (✓) appears when successfully saved

**Batch Operations:**
- **Select Multiple Cells:** Checkbox column (hidden by default, show on "Batch Mode" toggle)
- **Bulk Actions:** Apply same grade, mark as excused, send reminders
- **Confirmation:** Single confirmation dialog for batch actions (destructive only)

#### Interaction Patterns

**Primary Workflow: Inline Grading**
1. Instructor clicks on grade cell (e.g., Carol E. - Assignment 3)
2. Cell enters edit mode: input field appears with orange border
3. Instructor types grade (number, letter, or both)
4. Auto-save triggers 2 seconds after last keystroke
5. Checkmark appears, cell exits edit mode
6. Instructor tabs to next cell (or uses mouse)

**Secondary Workflow: Detailed Grading**
1. Instructor clicks on already-graded cell to view details
2. Slide-over panel opens from right (1/3 screen width)
3. Panel shows: Student name, assignment title, submission date, current grade, detailed feedback text area, file attachments
4. Instructor can edit grade, add/edit feedback, save
5. Close panel: grade updates in grid automatically

**Filter & Sort:**
- **Filter by Student:** Dropdown showing all students, type-ahead search
- **Filter by Assignment:** Show single assignment column across all students
- **Sort:** Click column header to sort by grade (high to low, low to high)

**Empty States:**
- **No Submissions Yet:** "No submissions yet. Students have until [Due Date]."
- **All Graded:** "✓ All assignments graded! Great work." (Success green)

#### Information Architecture Rationale

**Why This Grid Layout:**
1. **Familiar Mental Model:** Excel/Google Sheets pattern—instructors already know how to use grids
2. **At-a-Glance Overview:** See all students × assignments without scrolling (on desktop)
3. **Inline Editing:** 30% faster than modal-based grading (no context switching)
4. **Keyboard Efficiency:** Power users can grade 50 assignments in 15 minutes using Tab+Enter
5. **Status Visibility:** Color-coded cells immediately show pending/missing/overdue (no hunting)

**Why Inline vs. Modal:**
- **Speed:** Modal requires: Click → Wait for modal → Grade → Click Save → Close modal (5 steps, 3+ seconds)
- **Inline:** Click → Type → Auto-save (2 steps, <1 second with keyboard)
- **Context:** Instructor sees other students' grades for comparison (calibration)

**Mobile Adaptation:**
- Grid too complex for mobile → Use list view instead
- Each student = expandable card showing assignments
- Tap assignment → Edit inline within card
- Horizontal scroll as fallback for instructors on tablet

---

### 4.4 Course Detail Page (Tabbed Interface)

**Purpose:** Central hub for course learning experience. Students access content, view assignments, participate in discussions, and track progress. Existing tabbed navigation pattern maintained for familiarity.

**User Goals:**
- Navigate between course sections quickly (Overview, Content, Assignments, Discussions, Announcements)
- See course structure at a glance (modules, lessons, assignments)
- Track completion status (what's done, what's next)
- Access learning materials efficiently

**Design Principles Applied:**
- **Flexibility Through Standards:** Maintain existing tabbed pattern (don't reinvent)
- **Progress Visibility:** Show completion checkmarks, next lesson indicators
- **Speed Over Ceremony:** One-click access to any module/lesson

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [HEADER - Navy #1e293b]                                          │
│  AI Gurus LMS Logo    [Dashboard] [Courses] [Profile ▼]         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Page Container (max-w-7xl, px-6 py-8)                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Breadcrumb: Dashboard > My Courses > AI Strategy Fundamentals│
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Course Hero - Navy gradient background]                    │ │
│  │                                                              │ │
│  │  h1: "AI Strategy Fundamentals" (36px Bold White)           │ │
│  │  p: "Learn strategic AI decision-making..." (16px White/80%)│ │
│  │                                                              │ │
│  │  Progress: 65% ████████░░░░ [8 of 12 modules complete]      │ │
│  │  (White progress bar with orange fill)                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Tab Navigation - White background, sticky on scroll]       │ │
│  │                                                              │ │
│  │ [Overview] [Content] [Assignments] [Discussions] [Announce] │ │
│  │  (Active tab: Purple underline 3px, Bold text)              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Tab Content Area]                                           │ │
│  │                                                              │ │
│  │ === CONTENT TAB (Active) ===                                │ │
│  │                                                              │ │
│  │ [2-Column Layout: Sidebar + Main Content]                   │ │
│  │                                                              │ │
│  │ ┌──────────────────┐  ┌───────────────────────────────────┐│
│  │ │ SIDEBAR (30%)    │  │ MAIN CONTENT (70%)                ││
│  │ │ [Sticky scroll]  │  │                                   ││
│  │ │                  │  │ h2: "Module 3: Build vs Buy"      ││
│  │ │ Module 1 ✓       │  │                                   ││
│  │ │  Lesson 1 ✓      │  │ [Video Player or Content Display] ││
│  │ │  Lesson 2 ✓      │  │ ┌────────────────────────────────┐││
│  │ │  Quiz 1 ✓        │  │ │ [Video: 12:34 / 18:45]         │││
│  │ │                  │  │ │ ▶ Play/Pause controls          │││
│  │ │ Module 2 ✓       │  │ │ Progress slider                │││
│  │ │  Lesson 3 ✓      │  │ │                                │││
│  │ │  Lesson 4 ✓      │  │ └────────────────────────────────┘││
│  │ │                  │  │                                   ││
│  │ │ Module 3 → (Now) │  │ Lesson Description:               ││
│  │ │  Lesson 5 → Now  │  │ Understanding when to build...    ││
│  │ │  Lesson 6        │  │                                   ││
│  │ │  Assignment 3    │  │ Key Concepts:                     ││
│  │ │                  │  │ • Total cost of ownership         ││
│  │ │ Module 4         │  │ • Time-to-market tradeoffs        ││
│  │ │  Lesson 7        │  │ • Core vs. non-core capabilities  ││
│  │ │  Lesson 8        │  │                                   ││
│  │ │                  │  │ [Mark Complete] [Next Lesson →]   ││
│  │ │ [12 modules...]  │  │ Orange button   Navy link         ││
│  │ │                  │  │                                   ││
│  │ └──────────────────┘  └───────────────────────────────────┘│
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Tab Specifications

**Tab Navigation Bar:**
- **Container:** White background, border-bottom 1px #e2e8f0, sticky on scroll (top: 0)
- **Tab Items:** Horizontal flex, gap 32px, padding py-4 px-6
- **Typography:** 16px Semibold
- **States:**
  - Active: Purple (#7c3aed) text, 3px bottom border, Bold (600)
  - Inactive: Slate (#64748b) text, hover → Navy (#1e293b)
  - Hover: Underline appears (2px #e2e8f0)

**Tab Content Sections:**

**1. Overview Tab:**
- Course description (large body 18px)
- Learning objectives (bulleted list)
- Instructor information (name, bio, photo)
- Course stats: Duration, Modules, Assignments
- Enrollment status: "Enrolled on Nov 15, 2025"

**2. Content Tab (Primary Learning Experience):**
- **Sidebar:** Course outline with progress indicators
- **Main Area:** Active lesson content (video, text, embeds)
- **Progress Tracking:** Checkmarks (✓) on completed items
- **Navigation:** Next Lesson button always visible

**3. Assignments Tab:**
- List of all assignments (cards or table)
- Status: Not Started | In Progress | Submitted | Graded
- Due dates with color-coded urgency
- Quick submit action for pending assignments

**4. Discussions Tab:**
- Threaded discussion view
- Create new discussion button
- Filter: All | Unread | My Posts
- Reply inline (no modal)

**5. Announcements Tab:**
- Reverse chronological list
- Instructor posts only
- Pinned announcements at top
- Notification badge if unread

#### Component Specifications: Sidebar Navigation

**Module/Lesson List:**
- **Module Header:** 16px Semibold Navy, collapsible (▼/▶ icon)
- **Lesson Item:** 14px Regular Slate, indent 16px, truncate long titles
- **Completion Status:**
  - Complete: Green checkmark ✓ before title
  - Current: Orange arrow → and bold text
  - Incomplete: No icon, regular weight
- **Item Types:**
  - 📄 Lesson (default)
  - 📹 Video lesson (video icon)
  - 📝 Assignment (assignment icon)
  - ❓ Quiz (quiz icon)

**Module Progress Indicator:**
- Mini progress bar below module title: "3/5 complete"
- 4px height, rounded, orange fill

**Interaction:**
- Click module header → Expand/collapse lessons
- Click lesson → Load content in main area (same page, no navigation)
- Hover → Background #f8f9fa
- Current lesson → Background #fff7ed (soft orange)

#### Component Specifications: Main Content Area

**Video Player (If Content Type = Video):**
- **Player:** HTML5 video with custom controls (match brand colors)
- **Controls:** Play/pause, timeline scrubber, volume, playback speed, fullscreen
- **Dimensions:** 16:9 aspect ratio, max-width 100%, responsive
- **Progress:** Automatically saves progress every 10 seconds
- **Transcript:** Toggle button below video, opens accordion with searchable transcript (like Udemy)

**Text Content (If Content Type = Text/Article):**
- **Max Width:** 768px (Tailwind max-w-3xl) for readability
- **Typography:** 18px Large Body, line-height 1.75
- **Headings:** h2-h5 with hierarchy
- **Media:** Embedded images, diagrams at full width

**Interactive Elements:**
- **[Mark Complete] Button:** Orange, full width on mobile, appears after video completes or at bottom of text content
- **[Next Lesson →] Link:** Navy text, right-aligned, loads next lesson
- **Progress Auto-Save:** No explicit save button for video progress

#### Interaction Patterns

**Primary Workflow: Linear Learning**
1. Student clicks "Resume Course" from dashboard
2. Loads course detail page → Content tab → Last accessed lesson
3. Student consumes content (watches video, reads text)
4. Clicks [Mark Complete] or video auto-completes
5. Clicks [Next Lesson →] to continue
6. Sidebar updates with checkmark, orange arrow moves to next lesson

**Secondary Workflow: Non-Linear Navigation**
1. Student clicks different module/lesson in sidebar
2. Content loads in main area (no page reload, smooth transition)
3. URL updates for direct linking (e.g., /courses/123/lessons/45)
4. Progress tracked even for non-linear navigation

**Tab Switching:**
- Click tab → Smooth fade transition to new content (200ms)
- URL updates (e.g., /courses/123/overview, /courses/123/assignments)
- Sidebar persists when switching to Assignments/Discussions tabs

**Empty States:**
- **No Content Yet:** "Content coming soon" with instructor note
- **All Complete:** "✓ You've completed all modules! Well done." with purple celebration

**Mobile Adaptations:**
- Sidebar collapses into hamburger menu (sticky at top)
- Tap hamburger → Slide-out sidebar from left
- Video player responsive (maintains 16:9)
- Tab navigation scrolls horizontally on small screens

#### Information Architecture Rationale

**Why Tabbed Interface:**
1. **Existing Pattern:** Already implemented, familiar to users
2. **Clear Separation:** Content vs. Assignments vs. Discussions—distinct workflows
3. **Reduced Cognitive Load:** Students focus on one aspect at a time
4. **Standard LMS Pattern:** Coursera, Udemy, Canvas all use tabs

**Why Sidebar + Main Content:**
1. **Course Structure Visibility:** Always see full outline without modal
2. **Quick Navigation:** Jump to any lesson without leaving page
3. **Progress Context:** See completed vs. remaining at a glance
4. **Standard Pattern:** YouTube playlist sidebar, Udemy course player

**Why Sticky Elements:**
- **Tab Bar Sticky:** Always accessible, no scrolling back to switch tabs
- **Sidebar Sticky:** Course outline always visible during long content
- **Next Lesson Button:** Always visible at bottom of content (mobile)

---

### 4.5 Assignment Submission Interface

**Purpose:** Enable students to submit assignments with clear requirements, file uploads, and confirmation. Reduce submission errors and ambiguity.

**User Goals:**
- Understand assignment requirements clearly
- Submit text responses and/or file attachments
- Save drafts (auto-save, not lose work)
- Confirm successful submission
- View submission history if resubmission allowed

**Design Principles Applied:**
- **Guidance Through Clarity:** Requirements upfront, no hidden details
- **Speed Over Ceremony:** Auto-save drafts, one-click submit
- **Celebratory Feedback:** Success confirmation reassures students

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [HEADER - Navy #1e293b]                                          │
│  AI Gurus LMS Logo    [Dashboard] [Courses] [Profile ▼]         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Page Container (max-w-4xl, px-6 py-8 - narrower for readability)│
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Breadcrumb: Dashboard > AI Strategy > Assignments > #3      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Assignment Header - White card, p-6]                       │ │
│  │                                                              │ │
│  │ h1: "Assignment 3: Build vs Buy Analysis" (30px Bold Navy)  │ │
│  │                                                              │ │
│  │ [Metadata Row]                                               │ │
│  │ Course: AI Strategy Fundamentals                             │ │
│  │ Due: Nov 30, 2025 at 11:59 PM (In 2 days - Warning badge)   │ │
│  │ Points: 20                                                   │ │
│  │ Status: Not Submitted                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Requirements Section - White card, p-6]                    │ │
│  │                                                              │ │
│  │ h2: "Assignment Requirements" (24px Semibold Navy)          │ │
│  │                                                              │ │
│  │ Analyze a real-world AI implementation decision...          │ │
│  │                                                              │ │
│  │ Your submission should include:                             │ │
│  │ ✓ Problem statement (1 paragraph)                           │ │
│  │ ✓ Build vs. buy analysis (2-3 pages)                        │ │
│  │ ✓ Recommendation with rationale                             │ │
│  │ ✓ Implementation timeline                                   │ │
│  │                                                              │ │
│  │ [Download Assignment Template.docx]                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Submission Form - White card, p-6]                         │ │
│  │                                                              │ │
│  │ h2: "Your Submission" (24px Semibold Navy)                  │ │
│  │                                                              │ │
│  │ ┌──────────────────────────────────────────────────────┐   │ │
│  │ │ [Text Response - Optional or Required]                │   │ │
│  │ │                                                        │   │ │
│  │ │ Label: "Written Response" (16px Medium Navy)          │   │ │
│  │ │                                                        │   │ │
│  │ │ [Rich Text Editor - TinyMCE]                          │   │ │
│  │ │ ┌────────────────────────────────────────────────┐   │   │ │
│  │ │ │ [B] [I] [U] [Link] [List] [...]                │   │   │ │
│  │ │ ├────────────────────────────────────────────────┤   │   │ │
│  │ │ │                                                │   │   │ │
│  │ │ │ Type your response here...                     │   │   │ │
│  │ │ │                                                │   │   │ │
│  │ │ │ (Min height: 200px, expandable)                │   │   │ │
│  │ │ │                                                │   │   │ │
│  │ │ └────────────────────────────────────────────────┘   │   │ │
│  │ │                                                        │   │ │
│  │ │ Auto-saved 2 minutes ago ✓                             │   │ │
│  │ └──────────────────────────────────────────────────────┘   │ │
│  │                                                              │ │
│  │ ┌──────────────────────────────────────────────────────┐   │ │
│  │ │ [File Upload]                                          │   │ │
│  │ │                                                        │   │ │
│  │ │ Label: "Attachments" (16px Medium Navy)               │   │ │
│  │ │ Helper: "Upload up to 5 files (PDF, DOCX, max 10MB)"  │   │ │
│  │ │                                                        │   │ │
│  │ │ ┌────────────────────────────────────────────────┐   │   │ │
│  │ │ │ [Drag & drop zone - Dashed border #e2e8f0]     │   │   │ │
│  │ │ │                                                │   │   │ │
│  │ │ │     📁 Drag files here or [Browse]             │   │   │ │
│  │ │ │                                                │   │   │ │
│  │ │ └────────────────────────────────────────────────┘   │   │ │
│  │ │                                                        │   │ │
│  │ │ [Uploaded Files List]                                  │   │ │
│  │ │ ┌────────────────────────────────────────────────┐   │   │ │
│  │ │ │ 📄 BuildVsBuy_Analysis.pdf (2.3 MB)    [X]     │   │   │ │
│  │ │ │ Uploaded 5 minutes ago                         │   │   │ │
│  │ │ └────────────────────────────────────────────────┘   │   │ │
│  │ └──────────────────────────────────────────────────────┘   │ │
│  │                                                              │ │
│  │ ┌──────────────────────────────────────────────────────┐   │ │
│  │ │ [Submission Checklist - Optional, collapsed by default]│  │ │
│  │ │                                                        │   │ │
│  │ │ ▼ Pre-Submission Checklist (3/4 complete)             │   │ │
│  │ │ ✓ Problem statement included                           │   │ │
│  │ │ ✓ Analysis covers build and buy options                │   │ │
│  │ │ ✓ Clear recommendation provided                        │   │ │
│  │ │ ☐ Implementation timeline included                     │   │ │
│  │ └──────────────────────────────────────────────────────┘   │ │
│  │                                                              │ │
│  │ [Action Buttons]                                             │ │
│  │ [Submit Assignment]  [Save Draft]  [Cancel]                 │ │
│  │ Orange button        Navy outline   Slate link              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Submission History - Collapsible, if resubmission allowed] │ │
│  │                                                              │ │
│  │ ▶ Previous Submissions (1)                                   │ │
│  │   Click to expand and view past submissions                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Component Specifications

**Assignment Header:**
- **Container:** White card, p-6, border 1px #e2e8f0
- **Title:** 30px Bold Navy
- **Metadata:** 14px Regular Slate, grid layout (4 columns)
- **Due Date Badge:**
  - <3 days: Warning amber background
  - <1 day: Error red background
  - Past due: Error red, "Overdue" text
  - Normal: No badge, just text

**Requirements Section:**
- **Container:** White card, p-6, margin-top 24px
- **Content:** 18px Large Body for readability (assignment instructions are critical)
- **Checklist Items:** Rendered as styled list with checkmarks
- **Attachments:** If instructor includes template files, show as downloadable links

**Text Editor (TinyMCE):**
- **Toolbar:** Bold, Italic, Underline, Link, Bulleted List, Numbered List, Headings
- **Min Height:** 200px, expands with content
- **Border:** 1px #d0d0d0, focus → 2px Orange (#f97316)
- **Auto-Save:** Every 30 seconds, shows "Auto-saved X minutes ago ✓" below editor

**File Upload Zone:**
- **Drag & Drop:** Dashed border (#e2e8f0), hover → Orange tint background
- **Browse Button:** Navy outline button
- **File Constraints:** Display clearly (file types, size limits, count limits)
- **Progress:** Show upload progress bar for each file
- **Uploaded Files:** List with file name, size, timestamp, remove [X] button

**Submission Checklist (Optional Feature):**
- **Purpose:** Help students ensure completeness before submitting
- **Collapsed by Default:** Click to expand (▼/▶ icon)
- **Items:** Checkboxes that students manually check (or auto-detected if possible)
- **Progress:** "3/4 complete" indicator

**Action Buttons:**
- **Submit Assignment:**
  - Orange (#f97316), white text, py-3 px-6, 16px Semibold
  - Disabled if required fields missing (grayed out with tooltip)
  - Click → Confirmation dialog: "Ready to submit? You cannot edit after submission unless resubmission is allowed."
- **Save Draft:**
  - Navy outline button, py-3 px-6
  - Click → Saves immediately, toast notification "Draft saved ✓"
  - Auto-save means this is rarely needed, but provides manual control
- **Cancel:**
  - Slate text link, no border
  - Click → Confirmation if unsaved changes: "Discard changes?"

#### Interaction Patterns

**Primary Workflow: First-Time Submission**
1. Student navigates from dashboard or course page
2. Reads assignment requirements (scrolls down)
3. Optionally downloads template file
4. Types response in rich text editor (auto-saves every 30s)
5. Uploads supporting files (drag & drop or browse)
6. Reviews submission (optional checklist)
7. Clicks [Submit Assignment]
8. Confirmation dialog: "Ready to submit?"
9. Confirms → Submission processes
10. Success page: "✓ Assignment submitted successfully! Your instructor will review within 48 hours."

**Secondary Workflow: Resubmission (If Allowed)**
1. Student returns to assignment page
2. Sees previous submission in "Submission History" section
3. Can view past submission (read-only)
4. Makes changes in current submission form
5. Submits as new version
6. Previous submission archived, new one is active

**Auto-Save Behavior:**
- **Trigger:** 30 seconds after last keystroke in text editor
- **Indicator:** "Auto-saved 2 minutes ago ✓" (updates timestamp)
- **Storage:** Server-side (not localStorage), survives browser close
- **Restore:** If student returns before submitting, draft loads automatically

**File Upload States:**
- **Uploading:** Progress bar (0-100%), filename, "Uploading..."
- **Success:** Checkmark, file size, "Uploaded X minutes ago"
- **Error:** Red error icon, "Upload failed: File too large" with [Retry] button
- **Remove:** [X] button, confirmation: "Remove this file?"

**Empty States:**
- **No Previous Submissions:** Hide "Submission History" section
- **No Files Uploaded:** Show upload zone with prompt

**Success States:**
- **Submission Complete:** Redirect to success page with:
  - Green checkmark icon (large, celebratory)
  - "✓ Assignment submitted successfully!"
  - Instructor review timeline: "Your instructor will review within 48 hours"
  - Next steps: [Return to Course] [View Submissions] buttons

**Error States:**
- **Submission Failed:** Toast notification (persistent): "Submission failed. [Retry] [Save Draft]"
- **Network Error:** "Connection lost. Your work is saved as a draft. [Retry]"
- **File Upload Error:** Inline error below file upload zone

#### Information Architecture Rationale

**Why Linear Layout (Not Wizard):**
1. **All Requirements Visible:** Students see full context before starting
2. **No Step Anxiety:** Students don't wonder "how many more steps?"
3. **Flexible Navigation:** Can jump between text and files freely
4. **Standard Pattern:** Most LMS platforms use single-page submission forms

**Why Auto-Save:**
- Executives often multitask—may leave page open for hours
- Prevents loss of work due to session timeout, browser crash, etc.
- Reduces submission anxiety ("Did I lose my work?")

**Why Submission Confirmation:**
- Prevents accidental submissions (misclick on Submit button)
- Gives student moment to review before finalizing
- Aligns with "Guidance Through Clarity" principle

**Mobile Adaptations:**
- Rich text editor switches to native textarea on mobile (TinyMCE toolbar simplified)
- File upload uses native file picker (drag & drop disabled on touch)
- Buttons stack vertically (full width)
- Requirements section collapsible to reduce scrolling

---

### 4.6 Instructor Grading Interface (Detailed Feedback View)

**Purpose:** Complement the gradebook grid with detailed grading view for assignments requiring extensive feedback. Slide-over panel or dedicated page for reviewing submission, entering grade, and writing feedback.

**User Goals:**
- Review student submission (text + files)
- Enter numerical and/or letter grade
- Provide detailed written feedback
- Save and move to next student quickly
- Use feedback templates for common responses

**Design Principles Applied:**
- **Speed Over Ceremony:** Keyboard shortcuts to move between students, auto-save
- **Efficient Feedback:** Templates, inline editing, toast notifications

#### Layout Structure (Slide-Over Panel Approach)

```
┌─────────────────────────────────────────────────────────────────┐
│ [GRADEBOOK GRID UNDERNEATH - Dimmed overlay]                    │
│                                                                  │
│               ┌─────────────────────────────────────────────┐   │
│               │ [SLIDE-OVER PANEL - Right side, 600px width]│   │
│               │                                              │   │
│               │ [Header - Navy background, p-4]             │   │
│               │ h2: "Grade Submission" (20px Bold White)    │   │
│               │ [Close X]                                    │   │
│               │                                              │   │
│               │ [Student Info Bar - White, p-4]             │   │
│               │ Student: Carol Edwards                       │   │
│               │ Assignment: Build vs Buy Analysis            │   │
│               │ Submitted: Nov 28, 2025 at 10:15 PM         │   │
│               │ Status: On time ✓                            │   │
│               │                                              │   │
│               │ [← Previous Student] [Next Student →]       │   │
│               │ (Keyboard: Ctrl+←/→)                         │   │
│               │                                              │   │
│               │ ┌────────────────────────────────────────┐  │   │
│               │ │ [Submission Content - Scrollable]       │  │   │
│               │ │                                         │  │   │
│               │ │ === Student Response ===                │  │   │
│               │ │ (Rich text displayed, read-only)        │  │   │
│               │ │                                         │  │   │
│               │ │ Problem Statement:                      │  │   │
│               │ │ Our company is considering...           │  │   │
│               │ │                                         │  │   │
│               │ │ === Attachments ===                     │  │   │
│               │ │ 📄 BuildVsBuy_Analysis.pdf (2.3 MB)     │  │   │
│               │ │ [Download] [Preview]                    │  │   │
│               │ │                                         │  │   │
│               │ └────────────────────────────────────────┘  │   │
│               │                                              │   │
│               │ ┌────────────────────────────────────────┐  │   │
│               │ │ [Grading Section - White card, p-4]    │  │   │
│               │ │                                         │  │   │
│               │ │ Label: "Grade" (16px Medium Navy)       │  │   │
│               │ │ [Input: 85] / 20 points                 │  │   │
│               │ │ (Letter Grade: B - auto-calculated)     │  │   │
│               │ │                                         │  │   │
│               │ │ Label: "Feedback" (16px Medium Navy)    │  │   │
│               │ │ [Feedback Templates ▼]                  │  │   │
│               │ │ - Excellent work                        │  │   │
│               │ │ - Good analysis, needs improvement...   │  │   │
│               │ │ - Missing key components                │  │   │
│               │ │                                         │  │   │
│               │ │ [Rich Text Editor - Medium size]        │  │   │
│               │ │ ┌──────────────────────────────────┐   │  │   │
│               │ │ │ Solid analysis of build vs buy  │   │  │   │
│               │ │ │ tradeoffs. Your recommendation  │   │  │   │
│               │ │ │ is well-supported. Consider...  │   │  │   │
│               │ │ │                                  │   │  │   │
│               │ │ └──────────────────────────────────┘   │  │   │
│               │ │                                         │  │   │
│               │ │ Auto-saved 1 minute ago ✓               │  │   │
│               │ │                                         │  │   │
│               │ │ [Save & Next Student →]                 │  │   │
│               │ │ Orange button (Keyboard: Ctrl+Enter)    │  │   │
│               │ │                                         │  │   │
│               │ │ [Save] [Cancel]                         │  │   │
│               │ │ Navy    Slate                           │  │   │
│               │ └────────────────────────────────────────┘  │   │
│               │                                              │   │
│               └─────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Component Specifications

**Slide-Over Panel:**
- **Width:** 600px (fixed), slides in from right
- **Background:** White with shadow-xl (heavy shadow for depth)
- **Overlay:** Dark overlay (rgba(0,0,0,0.4)) behind panel, dimming gradebook
- **Animation:** Slide in 300ms ease-out
- **Close:** Click [X], click overlay, or Esc key

**Navigation Between Students:**
- **Buttons:** [← Previous] [Next →] at top of panel
- **Keyboard:** Ctrl+Left Arrow (previous), Ctrl+Right Arrow (next)
- **Behavior:** Loads next student's submission without closing panel (smooth transition)
- **Indicator:** "Student 3 of 12" displayed

**Submission Content Display:**
- **Max Height:** Scrollable area (vh - 400px), scroll within panel
- **Text:** 16px Regular, line-height 1.625, read-only
- **Attachments:** Listed with download and preview buttons
- **Preview:** Opens PDF/images in new tab or inline viewer

**Grade Input:**
- **Input Field:** 48px wide, 16px text, border 2px Orange on focus
- **Format:** Number input with validation (0-20 in this example)
- **Letter Grade:** Auto-calculated and displayed based on grading scale
- **Error Handling:** "Grade must be between 0 and 20" inline error

**Feedback Templates Dropdown:**
- **Purpose:** Speed up common feedback patterns
- **Trigger:** Click dropdown, shows 3-5 preset templates
- **Behavior:** Click template → Inserts text into editor (can edit after insertion)
- **Custom Templates:** Instructors can save their own (future feature noted)

**Feedback Editor:**
- **Editor:** TinyMCE, simplified toolbar (Bold, Italic, List)
- **Height:** 150px min, expandable
- **Auto-Save:** Every 30 seconds
- **Indicator:** "Auto-saved X minutes ago ✓"

**Action Buttons:**
- **Save & Next Student:**
  - Orange button, saves current grade + feedback, loads next student
  - Keyboard: Ctrl+Enter
  - Most efficient workflow for grading multiple students
- **Save:**
  - Navy outline button, saves without advancing
  - Use when instructor needs to pause or review
- **Cancel:**
  - Slate link, discards unsaved changes (confirmation if changes exist)

#### Interaction Patterns

**Primary Workflow: Batch Grading**
1. Instructor opens gradebook grid
2. Clicks on assignment cell (e.g., Carol E. - Assignment 3)
3. Slide-over panel opens from right
4. Reviews submission content (scrolls if needed)
5. Enters grade in input field
6. (Optional) Selects feedback template or writes custom feedback
7. Clicks [Save & Next Student →] or presses Ctrl+Enter
8. Panel smoothly transitions to next student (fade out/in 200ms)
9. Repeat for all students
10. Close panel when done (or auto-closes when reaching last student)

**Secondary Workflow: Detailed Review**
1. Instructor needs more time for complex assignment
2. Opens slide-over panel
3. Downloads attachment to review offline
4. Leaves panel open (doesn't close)
5. Returns later, enters grade and feedback
6. Saves without advancing to next student

**Keyboard Efficiency:**
- **Ctrl+Left/Right:** Navigate between students
- **Ctrl+Enter:** Save & next student
- **Tab:** Move between grade input → feedback editor → buttons
- **Esc:** Close panel

**Auto-Save Safety:**
- If instructor closes panel without explicitly saving, auto-saved draft is preserved
- Next time panel opens for that student, draft loads
- Prevents accidental loss of feedback

**Empty/Missing Submission:**
- If student hasn't submitted, panel shows: "No submission yet. Due: Nov 30."
- Option to: [Send Reminder Email] [Mark as Excused] [Close]

**Success Feedback:**
- After saving: Toast notification (2s): "Grade saved for Carol E. ✓"
- Gradebook grid updates in background (checkmark appears in cell)

#### Information Architecture Rationale

**Why Slide-Over Panel (Not Modal or Separate Page):**
1. **Context Preservation:** Instructor sees gradebook grid underneath (useful for comparison)
2. **Faster Than Navigation:** No page load, instant open/close
3. **Familiar Pattern:** Gmail compose, Notion comments use slide-overs

**Why Auto-Save:**
- Instructors may grade 50+ assignments in one session
- Browser crash or timeout would lose extensive feedback
- Safety net for batch grading workflow

**Why Feedback Templates:**
- Common patterns emerge (e.g., "Excellent work", "Missing X component")
- Templates save typing time (aligned with 30% efficiency goal)
- Instructors can still personalize after inserting template

**Alternative: Dedicated Page (For Very Long Submissions):**
- If assignment submission is very long (10+ pages), slide-over may feel cramped
- In that case, use full-page grading interface with sidebar navigation between students
- This is noted as "future enhancement" if needed post-MVP

---

### 4.7 Course Catalog (Enrollment Entry Point)

**Purpose:** Enable students to browse available courses, view details, and enroll. Acts as entry point for new students and discovery mechanism for additional courses.

**User Goals:**
- Browse all available courses
- Filter/search by topic or category
- Preview course content before enrolling
- Understand time commitment and difficulty
- Enroll with one click

**Design Principles Applied:**
- **Guidance Through Clarity:** Course details visible upfront, no surprises
- **Speed Over Ceremony:** One-click enrollment (no complex wizards)
- **Progress Visibility:** Show enrolled status, completion if already taken

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [HEADER - Navy #1e293b]                                          │
│  AI Gurus LMS Logo    [Dashboard] [Courses] [Profile ▼]         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Page Container (max-w-7xl, px-6 py-8)                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ h1: "Course Catalog" (36px Bold Navy)                       │ │
│  │ p: "Explore AI leadership courses" (16px Slate)             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Filter/Search Bar - White card, p-4, flex]                 │ │
│  │                                                              │ │
│  │ [🔍 Search courses...     ]  [All Topics ▼]  [All Levels ▼]│ │
│  │  (400px search input)         Dropdown       Dropdown       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [3-Column Grid - Gap: 24px]                                    │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐│
│  │ COURSE CARD      │ │ COURSE CARD      │ │ COURSE CARD      ││
│  │                  │ │                  │ │                  ││
│  │ [Course Image]   │ │ [Course Image]   │ │ [Course Image]   ││
│  │ (16:9 aspect)    │ │                  │ │                  ││
│  │                  │ │                  │ │                  ││
│  │ h3: AI Strategy  │ │ h3: Implementation│ │ h3: Leadership   ││
│  │     Fundamentals │ │     Roadmap       │ │     Excellence   ││
│  │                  │ │                  │ │                  ││
│  │ Learn strategic  │ │ Build 6-12 month │ │ Lead AI trans... ││
│  │ AI decision...   │ │ AI implement...  │ │                  ││
│  │                  │ │                  │ │                  ││
│  │ 📚 12 modules    │ │ 📚 8 modules     │ │ 📚 10 modules    ││
│  │ ⏱ 6 weeks       │ │ ⏱ 4 weeks       │ │ ⏱ 5 weeks       ││
│  │ 📊 Intermediate  │ │ 📊 Advanced      │ │ 📊 Intermediate  ││
│  │                  │ │                  │ │                  ││
│  │ [✓ Enrolled]     │ │ [Enroll Now]     │ │ [✓ Completed]    ││
│  │ Green badge      │ │ Orange button    │ │ Purple badge     ││
│  └──────────────────┘ └──────────────────┘ └──────────────────┘│
│                                                                  │
│  [More course cards...]                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Component Specifications

**Course Card:**
- **Size:** Min-height 400px, flexible width (3-column grid → 1-column mobile)
- **Background:** White card, border 1px #e2e8f0, rounded-lg
- **Shadow:** shadow on hover (lift effect)
- **Padding:** p-0 (image full-bleed at top, content p-6)

**Card Structure:**
1. **Course Image:** 16:9 aspect ratio, covers top of card, object-fit: cover
   - Placeholder if no image: Navy gradient with course icon
2. **Course Title (h3):** 24px Semibold Navy, max 2 lines, truncate with ellipsis
3. **Description:** 14px Regular Slate, max 3 lines, truncate
4. **Metadata Row:** 12px Regular Slate, icons + text
   - 📚 Module count (e.g., "12 modules")
   - ⏱ Duration (e.g., "6 weeks")
   - 📊 Difficulty (Beginner, Intermediate, Advanced)
5. **Enrollment Status/CTA:**
   - **Not Enrolled:** [Enroll Now] Orange button, full width
   - **Enrolled:** Green badge "✓ Enrolled" + [Continue Course] link
   - **Completed:** Purple badge "✓ Completed" + [View Certificate] link

**Filter/Search Bar:**
- **Search Input:** 400px width, border 1px #d0d0d0, focus → 2px Orange
- **Dropdowns:** Radix UI Select components, navy text, hover state
- **Topics:** Strategy, Implementation, Leadership, Technical, All
- **Levels:** Beginner, Intermediate, Advanced, All

**Empty States:**
- **No Courses Found:** "No courses match your search. [Clear Filters]"
- **No Courses Available:** "New courses coming soon! Check back later."

#### Interaction Patterns

**Primary Workflow: Browse and Enroll**
1. Student navigates to Course Catalog from dashboard
2. Sees all available courses (enrolled status visible)
3. (Optional) Uses search or filters to narrow options
4. Clicks course card to view detail modal or navigates to course detail page
5. Reviews course overview, syllabus, instructor
6. Clicks [Enroll Now]
7. Confirmation: "Enrolled! [Go to Course]"

**Secondary Workflow: Course Preview**
1. Hover over course card → "Preview" link appears
2. Click Preview → Modal opens with course overview, sample lesson
3. Close modal or click [Enroll Now] from modal

**Card Hover States:**
- Lift with shadow-md
- [Enroll Now] button darkens slightly
- "Preview Course" link appears at bottom

#### Information Architecture Rationale

**Why Card Grid Layout:**
1. **Visual Browsing:** Course images create engaging, scannable layout
2. **Standard Pattern:** Udemy, Coursera, all course platforms use card grids
3. **Efficient Space:** 3 columns fit typical course catalog size (10-20 courses)

**Why Enrollment Status on Card:**
- Students see at a glance what they've enrolled in/completed
- Reduces accidental re-enrollment
- Progress visibility (completed badge = achievement)

**Why One-Click Enrollment:**
- No complex forms needed (student already has account)
- Reduces friction for beta cohort (all courses should be accessible)
- Confirmation prevents accidental clicks

---

### 4.8 Admin Dashboard (System Health & Operations)

**Purpose:** Central command center for administrators to monitor platform health, manage users, track usage metrics, and respond to issues. Focus on operational efficiency and visibility.

**User Goals:**
- Monitor platform health at a glance (uptime, errors, performance)
- Track key metrics (active users, course enrollments, assignment submissions)
- Identify and respond to issues quickly
- Access admin functions (user management, course management)

**Design Principles Applied:**
- **Guidance Through Clarity:** Dashboard shows status at a glance (green/yellow/red indicators)
- **Efficient Feedback:** Critical alerts prominent, non-critical summarized
- **Speed Over Ceremony:** Quick access to admin functions

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [HEADER - Navy #1e293b]                                          │
│  AI Gurus LMS Logo    [Admin] [Users] [Courses] [Reports] [▼]  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Page Container (max-w-7xl, px-6 py-8)                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ h1: "Admin Dashboard" (36px Bold Navy)                      │ │
│  │ Last updated: 2 minutes ago (auto-refresh)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [System Health Banner - Conditional]                        │ │
│  │ ✓ All systems operational (Green background)                │ │
│  │ OR                                                           │ │
│  │ ⚠ 2 issues require attention (Amber background) [View →]    │ │
│  │ OR                                                           │ │
│  │ ✕ Critical: Platform experiencing errors (Red) [Details →]  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [4-Column Grid - Key Metrics Cards - Gap: 24px]                │
│  ┌──────────────┐┌──────────────┐┌──────────────┐┌────────────┐│
│  │ METRIC CARD  ││ METRIC CARD  ││ METRIC CARD  ││ METRIC CARD││
│  │              ││              ││              ││            ││
│  │ Active Users ││ Enrollments  ││ Assignments  ││ Avg Response││
│  │              ││ (This Week)  ││ Submitted    ││ Time       ││
│  │     47       ││     12       ││    156       ││  1.2 days  ││
│  │ (36px Bold)  ││              ││              ││            ││
│  │              ││              ││              ││            ││
│  │ +12% vs last ││ +3 new       ││ 23 pending   ││ Target: 2d ││
│  │ week (Green) ││              ││ review       ││ (Green ✓)  ││
│  └──────────────┘└──────────────┘└──────────────┘└────────────┘│
│                                                                  │
│  [2-Column Layout: Charts + Recent Activity]                    │
│  ┌──────────────────────────────┐ ┌──────────────────────────┐ │
│  │ [System Performance - Chart] │ │ [Recent Activity]        │ │
│  │                              │ │                          │ │
│  │ h2: "Platform Health"        │ │ h2: "Recent Activity"    │ │
│  │                              │ │                          │ │
│  │ [Line Chart]                 │ │ • User "Alice C"         │ │
│  │ Uptime: 99.8%                │ │   enrolled in AI Strat   │ │
│  │ Avg Response: 245ms          │ │   2 minutes ago          │ │
│  │ Error Rate: 0.02%            │ │                          │ │
│  │                              │ │ • Assignment submitted   │ │
│  │ [View Details →]             │ │   by "Bob D"             │ │
│  │                              │ │   5 minutes ago          │ │
│  │                              │ │                          │ │
│  │                              │ │ • Instructor "Jane S"    │ │
│  │                              │ │   graded 12 assignments  │ │
│  │                              │ │   15 minutes ago         │ │
│  │                              │ │                          │ │
│  │                              │ │ [View All Activity →]    │ │
│  └──────────────────────────────┘ └──────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Quick Actions - Card with button grid]                     │ │
│  │                                                              │ │
│  │ h2: "Quick Actions"                                          │ │
│  │                                                              │ │
│  │ [+ Add User] [+ Create Course] [📊 Generate Report]         │ │
│  │ Navy buttons                                                 │ │
│  │                                                              │ │
│  │ [📧 Email All Users] [⚙ System Settings] [📚 View Docs]     │ │
│  │ Outline buttons                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Alerts & Notifications - Collapsible if none]              │ │
│  │                                                              │ │
│  │ h2: "Alerts" (with badge: "2 new")                          │ │
│  │                                                              │ │
│  │ ⚠ Warning: 5 students have overdue assignments > 7 days     │ │
│  │   [View Students] [Send Reminders]                          │ │
│  │                                                              │ │
│  │ ℹ Info: New course content published by Instructor "Jane S" │ │
│  │   [Review Content]                                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Component Specifications

**System Health Banner:**
- **Height:** 60px, full width, rounded corners
- **States:**
  - **Operational:** Green (#d1fae5) background, "✓ All systems operational"
  - **Warning:** Amber (#fef3c7) background, "⚠ X issues require attention [View →]"
  - **Critical:** Red (#fee2e2) background, "✕ Critical: [description] [Details →]"
- **Auto-Refresh:** Updates every 2 minutes

**Metric Cards:**
- **Size:** Equal width (4 columns), min-height 160px
- **Background:** White, border 1px #e2e8f0, shadow-sm
- **Structure:**
  1. **Label:** 14px Semibold Slate (e.g., "Active Users")
  2. **Value:** 36px Bold Navy (e.g., "47")
  3. **Change Indicator:** 14px Regular with color (e.g., "+12% vs last week" in green)
- **Interaction:** Click card → Navigate to detailed view

**Charts:**
- **Library:** Recharts or Chart.js with brand colors
- **Colors:** Orange for primary data, slate for secondary, semantic colors for status
- **Responsive:** Full width in container, height 300px

**Recent Activity Feed:**
- **Container:** White card, scrollable (max-height 300px)
- **Items:** 14px Regular Slate, icon + description + timestamp
- **Real-time:** Updates as events occur (WebSocket or polling)

**Quick Actions:**
- **Buttons:** Navy primary buttons for critical actions, outline for secondary
- **Grid:** 3 columns on desktop, 1 column on mobile

**Alerts:**
- **Priority Levels:**
  - Critical: Red border-left, icon ✕
  - Warning: Amber border-left, icon ⚠
  - Info: Blue border-left, icon ℹ
- **Collapsible:** If no alerts, section collapses or shows "✓ No active alerts"

#### Interaction Patterns

**Primary Workflow: Daily Health Check**
1. Admin logs in, sees dashboard
2. Checks system health banner (green = all good)
3. Reviews key metrics for anomalies
4. Checks alerts section (if any)
5. Takes action if needed (e.g., send reminders for overdue assignments)

**Secondary Workflow: Investigating Issues**
1. Admin notices warning in health banner
2. Clicks [View →] to see details
3. Navigates to error logs or affected area
4. Resolves issue or escalates

**Real-Time Updates:**
- Metrics refresh every 5 minutes (or live with WebSocket)
- Recent activity stream updates in real-time
- System health checks every 2 minutes

#### Information Architecture Rationale

**Why Dashboard-First Approach:**
- Admins need overview before diving into specific areas
- Critical issues surface immediately (health banner)
- Metrics provide context for decision-making

**Why These Specific Metrics:**
- **Active Users:** Growth indicator (beta success)
- **Enrollments:** Course popularity, program health
- **Assignments Submitted:** Engagement metric
- **Avg Response Time:** Instructor efficiency (30% goal tracking)

**Why Quick Actions Prominent:**
- Most common admin tasks one click away
- Reduces navigation friction
- Aligns with "Speed Over Ceremony" principle

---

### 4.9 User Management (Admin Workflow)

**Purpose:** Enable administrators to create, edit, and manage user accounts (students, instructors, admins). Bulk operations for efficiency, role-based permissions.

**User Goals:**
- View all users with status (active, inactive, suspended)
- Create new user accounts (<5 minutes per user target)
- Edit user details and roles
- Bulk operations (import CSV, mass email, bulk role changes)
- Search and filter users efficiently

**Design Principles Applied:**
- **Speed Over Ceremony:** Quick user creation forms, bulk import
- **Guidance Through Clarity:** User status and roles clearly indicated
- **Flexibility Through Standards:** Table/grid view with filters (familiar pattern)

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [HEADER - Navy #1e293b]                                          │
│  AI Gurus LMS Logo    [Admin] [Users] [Courses] [Reports] [▼]  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Page Container (max-w-7xl, px-6 py-8)                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ h1: "User Management" (36px Bold Navy)                      │ │
│  │ p: "47 total users (42 active, 5 inactive)"                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Toolbar - White card, p-4, flex justify-between]           │ │
│  │                                                              │ │
│  │ [🔍 Search users...] [Role: All ▼] [Status: All ▼]          │ │
│  │  (300px search)       Dropdown       Dropdown               │ │
│  │                                                              │ │
│  │ [+ Add User] [Import CSV] [⋮ Bulk Actions]                  │ │
│  │ Orange btn   Navy outline Navy outline                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [User Table - White card, overflow-x: auto]                 │ │
│  │                                                              │ │
│  │ ┌───┬──────────┬─────────────┬───────┬────────┬─────────┐  │ │
│  │ │☐  │ Name     │ Email       │ Role  │ Status │ Actions │  │ │
│  │ ├───┼──────────┼─────────────┼───────┼────────┼─────────┤  │ │
│  │ │☐  │ Alice C. │alice@co.com │Student│✓Active │ [Edit]  │  │ │
│  │ │   │          │             │       │ (Green)│ [⋮]     │  │ │
│  │ ├───┼──────────┼─────────────┼───────┼────────┼─────────┤  │ │
│  │ │☐  │ Bob D.   │bob@co.com   │Student│✓Active │ [Edit]  │  │ │
│  │ │   │          │             │       │        │ [⋮]     │  │ │
│  │ ├───┼──────────┼─────────────┼───────┼────────┼─────────┤  │ │
│  │ │☐  │ Carol E. │carol@co.com │Student│✓Active │ [Edit]  │  │ │
│  │ ├───┼──────────┼─────────────┼───────┼────────┼─────────┤  │ │
│  │ │☐  │ Jane S.  │jane@co.com  │Instruc│✓Active │ [Edit]  │  │ │
│  │ │   │          │             │tor    │        │ [⋮]     │  │ │
│  │ ├───┼──────────┼─────────────┼───────┼────────┼─────────┤  │ │
│  │ │☐  │ Ed H.    │ed@co.com    │Admin  │✓Active │ [Edit]  │  │ │
│  │ ├───┼──────────┼─────────────┼───────┼────────┼─────────┤  │ │
│  │ │☐  │ Frank G. │frank@co.com │Student│Inactive│ [Edit]  │  │ │
│  │ │   │          │             │       │ (Slate)│ [⋮]     │  │ │
│  │ └───┴──────────┴─────────────┴───────┴────────┴─────────┘  │ │
│  │                                                              │ │
│  │ [Pagination: 1 2 3 ... 5 - Showing 1-10 of 47]              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Component Specifications

**User Table:**
- **Columns:**
  - Checkbox (for bulk selection)
  - Name (sortable)
  - Email (sortable, searchable)
  - Role (filterable: Student, Instructor, Admin)
  - Status (filterable: Active, Inactive, Suspended)
  - Actions ([Edit] button + [⋮] dropdown menu)
- **Rows:** Hover state with #f8f9fa background
- **Status Badges:**
  - Active: Green text with ✓ icon
  - Inactive: Slate text
  - Suspended: Red text with warning icon

**Add User Modal/Slide-Over:**
Opens when [+ Add User] clicked:
- **Fields:**
  - First Name (required)
  - Last Name (required)
  - Email (required, validated)
  - Role dropdown (Student, Instructor, Admin)
  - Send welcome email? (checkbox, default: checked)
- **Actions:** [Create User] orange button, [Cancel] link
- **Target:** Complete in <2 minutes

**Edit User Panel:**
- Slide-over from right (similar to grading panel)
- Edit all user fields
- Additional options:
  - Reset password (sends email to user)
  - Change role
  - Suspend account (with reason field)
  - Delete account (confirmation required)

**Bulk Actions Dropdown:**
- Export selected users (CSV)
- Send email to selected users
- Change role (bulk)
- Deactivate selected users
- Delete selected users (confirmation with count)

**Import CSV:**
- Opens modal with drag-and-drop zone
- Template download: "Download CSV template"
- Validation: Shows errors before import (e.g., "Row 5: Invalid email format")
- Confirmation: "Import 25 users? [Confirm] [Cancel]"

#### Interaction Patterns

**Primary Workflow: Add Single User**
1. Admin clicks [+ Add User]
2. Modal opens with form
3. Fills required fields (name, email, role)
4. Clicks [Create User]
5. System creates account, sends welcome email (if checked)
6. Toast notification: "User created ✓"
7. Table updates with new user

**Secondary Workflow: Bulk Import**
1. Admin clicks [Import CSV]
2. Downloads template if first time
3. Fills CSV with user data (name, email, role)
4. Drags CSV into import modal
5. System validates (shows errors if any)
6. Confirms import: "25 users will be created. [Confirm]"
7. Batch process runs (shows progress bar)
8. Success: "25 users imported successfully ✓"

**Tertiary Workflow: Edit User**
1. Admin clicks [Edit] on user row
2. Slide-over panel opens with user details
3. Edits fields as needed
4. Clicks [Save] (auto-saves)
5. Panel closes, table updates

**Search & Filter:**
- **Search:** Types in search box → Filters table in real-time (searches name and email)
- **Role Filter:** Selects "Instructor" → Shows only instructors
- **Status Filter:** Selects "Inactive" → Shows only inactive users
- **Combined:** All filters work together (AND logic)

#### Information Architecture Rationale

**Why Table View:**
- Standard pattern for user management (familiar to admins)
- Efficient scanning (all info visible at once)
- Sortable columns for quick finding

**Why Bulk Actions:**
- Beta program may onboard cohorts (10-20 users at once)
- CSV import saves hours vs. manual entry
- Bulk email enables announcement to specific groups

**Why <5 Minute Target:**
- PRD requirement for user onboarding efficiency
- Simple form + auto-send welcome email achieves this
- Bulk import for larger cohorts (even faster)

**Mobile Adaptation:**
- Table switches to card view (one user per card)
- Swipe actions for quick edit/delete
- Filters collapse into drawer

---

### 4.10 Screen Design Summary

**Complete Screen Inventory:**

**Priority 1 (Critical Path):**
1. ✓ Student Dashboard - First impression, resume learning
2. ✓ Instructor Gradebook - Inline editing, 30% efficiency gain
3. ✓ Course Detail Page - Tabbed learning hub

**Priority 2 (Core Functionality):**
4. ✓ Assignment Submission - Auto-save, file upload
5. ✓ Instructor Grading Interface - Slide-over panel, feedback templates

**Priority 3 (Administrative):**
6. ✓ Course Catalog - Browse and enroll
7. ✓ Admin Dashboard - System health monitoring
8. ✓ User Management - CRUD operations, bulk import

**Design Patterns Used Consistently:**

| Pattern | Application | Rationale |
|---------|-------------|-----------|
| **Navy + Orange + Purple** | All screens | Brand color system (authority + action + premium) |
| **Card-Based Layouts** | Dashboard, Catalog, Admin | Modern, scannable, mobile-friendly |
| **Inline Editing** | Gradebook, User Management | Speed over ceremony (no modal context switching) |
| **Auto-Save** | Assignment, Grading, Forms | Executive users multitask, prevent data loss |
| **Keyboard Shortcuts** | Gradebook, Grading Panel | Power user efficiency (30% goal) |
| **Toast Notifications** | All actions | Efficient feedback (non-blocking) |
| **Slide-Over Panels** | Grading, User Edit | Context preservation + speed |
| **Progress Visibility** | Dashboard, Course Detail | UX principle, Coursera-inspired |
| **Empty States** | All screens | Guidance through clarity |
| **Mobile Responsive** | All screens | Desktop-first, excellent mobile fallback |

**Implementation Priority:**

**Phase 1 (MVP - Beta Launch):**
- Student Dashboard
- Course Detail Page (Content tab)
- Assignment Submission
- Instructor Gradebook (basic grid)
- Admin: User Management (manual add only)

**Phase 2 (Post-Beta):**
- Instructor Grading Interface (detailed feedback)
- Course Catalog
- Admin Dashboard (health monitoring)
- Discussions Tab
- Bulk User Import

**Phase 3 (Scale):**
- Advanced filtering/search
- Analytics/reporting
- Notification system (email + in-app)
- Mobile apps (if needed)

All screens designed, ready for developer handoff!

---

### 1.1 Design System Choice

**Selected Design System:** Tailwind CSS 4 + Radix UI (Already Implemented)

**Rationale:**
The project has already established Tailwind CSS 4 with Radix UI accessible component primitives as the design foundation. This is an excellent choice for the AI Gurus LMS because:

1. **Accessibility Built-In:** Radix UI provides unstyled, accessible primitives that meet WCAG 2.1 AA requirements out of the box—critical for professional education platform serving executives

2. **Full Customization Control:** Tailwind's utility-first approach combined with Radix's headless components gives complete control over visual design while maintaining accessibility guarantees

3. **Modern Stack Alignment:** Perfect fit with Next.js 15 and React 19, leveraging Server Components and modern React patterns

4. **Production-Ready:** Both Tailwind CSS 4 and Radix UI are mature, well-maintained, and proven in production environments

5. **Developer Experience:** Excellent TypeScript support, comprehensive documentation, strong community

**What This System Provides:**
- **Radix UI Components:** Dialog, DropdownMenu, Select, Tabs, Toast, Tooltip, and other accessible primitives
- **Tailwind CSS 4:** Utility classes for rapid styling, responsive design, dark mode support
- **Accessibility:** ARIA attributes, keyboard navigation, focus management, screen reader support built-in
- **Theming:** CSS custom properties for consistent color, spacing, typography system
- **Documentation:** Extensive docs for both Tailwind and Radix UI

**Custom Components Needed:**
Based on the PRD requirements, we'll need to build custom components for:
- Gradebook grid view (students × assignments matrix with inline editing)
- Drag-and-drop content reordering (already implemented with @dnd-kit)
- Course catalog cards with enrollment actions
- Assignment submission interface with file uploads
- Discussion forum with threaded replies
- Admin dashboard with real-time statistics
- Rich text editor integration (TinyMCE already in use)

**Design System Version:**
- Tailwind CSS: 4.0 (latest)
- Radix UI: Latest stable versions of individual primitives
- Maintained consistency with existing component implementations

---

## 2. Core User Experience

### 2.1 Project and User Confirmation

**What We're Building:**
A production-grade Learning Management System that transforms how SME executives learn about AI implementation. Unlike generic LMS platforms or basic tool training, this system focuses on strategic AI decision-making—teaching executives when to implement AI, how to evaluate solutions, understanding build vs. buy tradeoffs, and recognizing when AI is appropriate versus unnecessary.

**Target Audience Deep Dive:**

**Primary Users: SME Executive Decision-Makers**
- **Demographics:** C-suite executives, VPs, Directors at companies with 50-500 employees
- **Technical Background:** Mixed—some technical, many non-technical
- **Current Challenge:** Self-educating through fragmented sources (HBR articles, YouTube, word-of-mouth), facing decision paralysis, overwhelmed by AI hype vs. reality
- **What They Need to Learn:**
  - When and how to implement AI in organizational workflows
  - How to evaluate AI vendors and solutions critically
  - Build vs. buy decision frameworks
  - Understanding when AI is necessary vs. when traditional solutions suffice
  - Conceptual understanding of transformer architecture and generative AI
  - Leading AI transformation initiatives with confidence

- **Platform Expectations:** Professional, polished experience reflecting brand credibility; mobile-responsive for busy schedules; clear navigation; reliable with no glitches; secure and trustworthy

**Secondary Users: Course Instructors**
- **Role:** AI fluency experts delivering curriculum, responsible for grading and student engagement
- **Current Pain Point:** Manual processes in Notion lack purpose-built instructional tools
- **Goals:** Efficient course management, streamlined grading workflow (30%+ time savings target), real-time visibility into student progress
- **Success Criteria:** Reduce administrative task time by 30%+, grade assignments 50% faster than Notion

**Secondary Users: Platform Administrators**
- **Role:** Internal team managing AI Fluency Program operations
- **Current Pain Point:** No centralized management, manual onboarding/reporting, limited platform visibility
- **Goals:** Centralized user and course management, automated reporting, system health monitoring, scalable operations
- **Success Criteria:** Onboard new students in <5 minutes, generate usage reports in <2 minutes, 99.5%+ platform uptime

**Core Platform Characteristics:**
- **Deployment:** Responsive web application (desktop-first, mobile/tablet support)
- **Browser Support:** Modern browsers only (Chrome, Firefox, Safari, Edge - last 2 versions)
- **Accessibility Requirement:** WCAG 2.1 AA compliance
- **Technical Foundation:** Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS 4, Radix UI
- **Existing Codebase:** 88 TypeScript files, 42 API endpoints, 10 database models (brownfield enhancement)

**Business Context:**
This LMS enables the bundled AI Readiness Assessment + Fluency offering, creating competitive parity with established platforms. The 3-month timeline targets Q1 2026 beta launch with 1-10 SME executive testers, validating product-market fit before scaling to 100+ users.

**What Makes This Different:**
Unlike competitors who teach "how to use AI tools," AI Gurus teaches "how to lead AI transformation"—focusing on strategic decision-making, critical evaluation of solutions, and understanding when AI is appropriate versus unnecessary.

### 2.2 Core Experience Definition

**The Defining Experience: Strategic Learning with Expert Feedback Loop**

The AI Gurus LMS is defined by one core experience that sets it apart from typical learning platforms: **Strategic AI decision-making education through structured curriculum → practical assignments → expert instructor feedback → actionable organizational insights.**

**For Each User Type:**

**Students (SME Executives):**
- **Core Action:** Complete assignments that demonstrate strategic AI understanding → Receive expert feedback validating decision-making skills
- **What Makes It Effortless:** Accessing course content and submitting assignments with zero friction—remove all barriers to learning
- **Critical Success Factor:** Assignment completion and meaningful instructor feedback (validates they're actually learning strategic skills, not just watching videos)

**Instructors:**
- **Core Action:** Efficiently review student work → Provide quality feedback at scale → Track student progress
- **What Makes It Effortless:** Batch grading with inline editing in gradebook, feedback templates for common scenarios
- **Critical Success Factor:** Grading workflow efficiency (30%+ time savings target vs. Notion)

**Administrators:**
- **Core Action:** Monitor platform health → Manage users efficiently → Track program effectiveness
- **What Makes It Effortless:** Centralized dashboard with real-time stats, <5-minute user onboarding
- **Critical Success Factor:** System reliability and operational visibility

**Most Critical UX to Get Right: The Gradebook/Grading Workflow**

Why this is the defining interaction:
- Instructors spend most time here (grading, feedback, tracking)
- Currently incomplete in existing codebase (major blocker)
- Directly impacts 30% efficiency improvement goal
- Poor grading UX = slow feedback = poor student experience = failed program

**Platform:** Responsive web application (desktop primary, mobile/tablet for on-the-go access)

### 2.3 Desired Emotional Response

**What Users Should FEEL:**

**For SME Executive Students:**
- **Empowered and Confident** - "I can make informed AI decisions for my organization"
- **Professionally Respected** - "This platform is designed for someone at my level" (not generic online course feel)
- **Clarity Emerging from Complexity** - "AI finally makes sense; I understand the strategic tradeoffs"
- **Productive, Not Overwhelmed** - "I'm learning efficiently without wasting time; every assignment has purpose"

This emotional response drives word-of-mouth: "You need to take this program—it changed how I think about AI implementation."

**For Instructors:**
- **Efficient and In Control** - "I can manage this workload without drowning in admin tasks"
- **Professional and Effective** - "I'm delivering quality education at scale; the platform supports my teaching"

**For Administrators:**
- **Confident in Platform Stability** - "Everything is running smoothly; I catch issues before they become problems"
- **In Control** - "I see and manage everything centrally; no scattered manual processes"

**Emotional Tone Principles:**
- Not "inspired and excited" (AI hype) → **Clarity and confidence** (cutting through hype)
- Not "zen-like calm" (meditation app) → **Professional empowerment** (executive productivity)
- Not purely "data-driven and analytical" → **Strategic and informed** (data informs decisions)

### 2.4 Inspiration Analysis: Learning from What Works

**Platforms Your Users Already Use:**
- **Udemy** - Consumer learning marketplace
- **Coursera** - Academic/professional education platform
- **LinkedIn Learning** - Career-focused professional development

**UX Patterns That Work Well:**

**1. Progress Visibility (All Three Platforms Excel Here)**
- **Coursera:** [Simple progress bars on every course](https://blog.coursera.org/new-progress-tracking-features-on-coursera/), centralized dashboard showing all progress at a glance, skill tracking with competency scores
- **Udemy:** [Visible course curriculum below video player](https://support.udemy.com/hc/en-us/articles/229603648-How-to-Use-The-Course-Player-and-Start-Your-Course), clear lecture completion checkmarks, autoplay next lecture
- **LinkedIn Learning:** Bite-sized progress tracking integrated with career profiles, learning paths toward career goals

**Why This Matters for AI Gurus:** Your UX principle "Progress Visibility" directly aligns—executives need to see their learning journey clearly. They're investing time in education; show them the return.

**2. Efficient Content Navigation**
- **Udemy:** [Auto-scroll transcripts with clickable sentences](https://support.udemy.com/hc/en-us/articles/229603648-How-to-Use-The-Course-Player-and-Start-Your-Course) to jump to specific moments, time adjustment icons, notes filter by lecture
- **Coursera:** One-click resume course, personalized recommendations on what to pursue next
- **LinkedIn Learning:** Offline learning, audio-only options for busy professionals, bite-sized videos

**Why This Matters:** SME executives are time-constrained—they need efficient content consumption, not endless scrolling or hunting for where they left off.

**3. Professional Dashboard Design**
- **Coursera:** [Centralized hub showing courses, certificates, and personalized recommendations](https://blog.coursera.org/whats-new-on-coursera-dashboard-and-course-home/), goal-setting features, clear schedule visibility
- **LinkedIn Learning:** Integration with professional profile (career-focused context), skill development tracking linked to job roles

**Why This Matters:** Executive learners expect professional polish, not "studentish" interfaces. The dashboard should feel like a business intelligence tool, not a grade school report card.

**4. Clear Course Structure**
- **Udemy:** All lectures visible upfront in curriculum sidebar, no mystery about what's coming, quiz/practice test items clearly marked
- **Coursera:** Schedules, quiz dates, and deadlines visible on dashboard, assessment dates communicated early

**Why This Matters:** Busy executives need to plan their learning time—no surprises. They want to see the full syllabus upfront and budget time accordingly.

**5. Mobile-Responsive (Critical for Executives)**
- All three platforms prioritize mobile experience with dedicated apps
- Offline capabilities for learning during flights, commutes
- [LinkedIn Learning mobile app](https://play.google.com/store/apps/details?id=com.linkedin.android.learning) offers audio-only mode for multitasking

**Why This Matters:** Your PRD mentions "mobile/tablet secondary"—but executives often learn during commutes, between meetings, during travel. Mobile should be first-class, not an afterthought.

**Patterns to Apply to AI Gurus LMS:**

✅ **Progress bars everywhere** - Course completion percentage, assignment progress, overall program completion
✅ **One-click resume** - Return users exactly where they left off (no hunting for "continue course")
✅ **Centralized dashboard** - Student sees all courses, current grades, upcoming assignments, announcements at a glance
✅ **Clear course structure upfront** - Full syllabus visible before enrollment, no hidden surprises
✅ **Mobile-first mindset** - Desktop primary, but ensure mobile experience is excellent (responsive, not just "works")
✅ **Professional aesthetics** - Coursera/LinkedIn polish level, not Udemy's consumer marketplace feel

**What AI Gurus Should Do BETTER Than These Platforms:**

🎯 **Feedback Quality Over Speed** - Coursera/Udemy provide automated quiz feedback; AI Gurus offers expert human instructor feedback on strategic decision-making (personalized, contextual, actionable)

🎯 **Cohort Learning Experience** - Most platforms are self-paced and isolating; AI Gurus can emphasize beta cohort learning together (discussions, peer insights, shared organizational challenges)

🎯 **Business Context Integration** - Link learning directly to organizational AI implementation roadmaps (not just personal skill-building for resume)

🎯 **Strategic Depth vs. Tool Training** - Competitors teach "how to use ChatGPT"; AI Gurus teaches "when to implement AI, how to evaluate solutions, build vs. buy tradeoffs"

**Sources:**
- [Coursera Progress Tracking Features](https://blog.coursera.org/new-progress-tracking-features-on-coursera/)
- [Coursera Dashboard Updates](https://blog.coursera.org/whats-new-on-coursera-dashboard-and-course-home/)
- [Udemy Course Player Features](https://support.udemy.com/hc/en-us/articles/229603648-How-to-Use-The-Course-Player-and-Start-Your-Course)
- [LinkedIn Learning Mobile Apps](https://play.google.com/store/apps/details?id=com.linkedin.android.learning)

### 2.5 Project Synthesis & Facilitation Approach

**Project Complexity Assessment:**

**UX Complexity Indicators:**
- ✅ **Multiple User Roles:** 3 distinct roles (Student, Instructor, Admin) with different workflows and permissions
- ✅ **Multiple Primary Journeys:** Enrollment → Learning → Assignment Submission → Grading → Feedback (plus instructor and admin workflows)
- ✅ **Rich Interactions:** Drag-and-drop content management, inline gradebook editing, threaded discussions, file uploads
- ✅ **Multi-Platform:** Desktop primary + mobile/tablet responsive (not native apps, but full responsive web)
- ✅ **Content Creation + Consumption:** Students consume + create (assignments), instructors create courses + grade submissions
- ✅ **Existing Patterns to Maintain:** Tabbed navigation, drag-and-drop, TinyMCE rich text editing

**Complexity Level:** Medium-High (multiple roles, rich interactions, production-grade requirements)

**Facilitation Mode: UX_BEGINNER**

Based on your skill level (beginner), I'll approach this design collaboration by:
- **Explaining design concepts in simple terms** - No jargon without explanation; focus on "why this matters"
- **Using real-world analogies** - Comparing UX patterns to familiar experiences
- **Focusing on user impact** - "This design choice helps executives because..."
- **Protecting from overwhelming choices** - Presenting 3-4 curated options, not endless possibilities
- **Showing, not just telling** - Generating visual mockups so you can SEE options, not imagine them

**Project Understanding Summary:**

**Vision:** AI Gurus LMS transforms SME executives from AI-overwhelmed decision-makers into confident AI leaders who can architect implementation roadmaps, evaluate solutions critically, and make informed build-vs-buy decisions.

**Users:**
- SME executives (primary) seeking strategic AI clarity, not tool training
- Instructors needing 30%+ efficiency gains vs. Notion
- Admins requiring centralized operations and 99.5%+ uptime

**Core Experience:** Strategic learning through expert feedback loops—assignments validate decision-making skills, not just content consumption.

**Desired Feeling:** Professional empowerment and confidence—"I can lead my organization's AI transformation informed by strategic understanding, not hype."

**Platform:** Responsive web (desktop primary, excellent mobile), Next.js 15 + React 19 + Tailwind CSS 4 + Radix UI

**Inspiration:** Coursera's professional polish + progress visibility, Udemy's efficient content navigation, LinkedIn Learning's career integration—but with deeper strategic focus and expert human feedback.

**UX Complexity:** Medium-High (3 roles, rich interactions, production requirements)

This foundation guides every design decision from here forward. Let's start designing!

### 2.6 Core Experience Principles

These principles guide every UX decision—from color choices to component interactions to layout patterns. They ensure consistency and alignment with user goals.

**Principle 1: Speed Over Ceremony**

**What it means:** Key actions (submit assignment, grade submission, view progress) complete in 2 clicks maximum. No unnecessary modals or confirmation dialogs unless the action is destructive (delete, irreversible changes).

**Why it matters:**
- SME executives value their time—friction kills engagement
- Instructors need 30% efficiency gains—every extra click compounds over 50 assignments
- Speed creates perception of professional quality

**Application Examples:**
- ✅ One-click "Resume Course" from dashboard (like Coursera's approach)
- ✅ Inline gradebook editing with single confirmation (no modal workflow for each grade)
- ✅ Auto-save drafts everywhere (assignments, grades, course content, discussions)
- ✅ Keyboard shortcuts for power users (Ctrl+Enter to submit, Tab to next field)
- ❌ Don't: Multi-step wizards for simple forms, confirmation dialogs for non-destructive actions

**Principle 2: Guidance Through Clarity, Not Hand-Holding**

**What it means:** Clear information hierarchy, visible next steps, self-evident interfaces—but assume users are intelligent adults who don't need tooltips explaining every button.

**Why it matters:**
- Executives expect professional tools that respect their intelligence
- Over-explanation feels patronizing and clutters the interface
- Clarity comes from good information design, not more text

**Application Examples:**
- ✅ Dashboard shows "Next: Complete Assignment 3 (Due Nov 30)" with direct link
- ✅ Course structure visible upfront (full syllabus on enrollment page)
- ✅ Assignment requirements clearly stated in description, not buried behind help icons
- ✅ Empty states show clear CTAs ("Create Your First Course" with single button)
- ❌ Don't: Tooltips on standard UI elements (buttons labeled "Submit" don't need tooltip "Click here to submit")
- ❌ Don't: Onboarding tours forcing users through 15 steps before they can use the platform

**Principle 3: Flexibility Through Standards**

**What it means:** Use established, familiar interaction patterns rather than reinventing how things work. Innovation in content/strategy, convention in interface.

**Why it matters:**
- Familiarity = speed (users already know how tabs, forms, tables work)
- Novel interactions = learning curve + frustration
- Executives switch between many tools—consistency across platforms reduces cognitive load

**Application Examples:**
- ✅ Maintain existing tabbed course navigation (Overview/Content/Assignments/Discussions/Announcements)
- ✅ Standard form patterns for assignment submission (not creative multi-step wizards)
- ✅ Gradebook grid view (Excel/Google Sheets mental model) not creative card layouts
- ✅ Drag-and-drop using @dnd-kit (already implemented, familiar pattern)
- ✅ Rich text editor (TinyMCE) uses standard formatting toolbar
- ❌ Don't: Novel navigation patterns (e.g., circular menus, gesture-only navigation)
- ❌ Don't: Reinvent standard controls (custom dropdowns when native <select> works fine)

**Principle 4: Feedback: Celebratory for Students, Efficient for Instructors**

**What it means:** Feedback style matches user context—students need motivation and reassurance; instructors need efficiency with minimal interruptions.

**Why it matters:**
- Students are investing time and need encouragement (progress milestones matter)
- Instructors are processing volume and need to stay in flow state (interruptions kill productivity)
- Different users, different emotional needs

**Application Examples:**

**For Students (Celebratory):**
- ✅ Submit assignment → "✓ Submitted! Your instructor will review within 48 hours" (reassuring message)
- ✅ Complete module → Progress bar animates, "Module Complete!" with visual celebration
- ✅ Receive grade → Notification badge + summary card showing grade and feedback snippet
- ✅ Complete course → Achievement card with completion certificate preview

**For Instructors (Efficient):**
- ✅ Save grade → Subtle toast notification (non-blocking, auto-dismiss 2 seconds)
- ✅ Auto-save in background (no explicit "Saved" message unless manual save)
- ✅ Batch operations complete → Single summary notification "12 assignments graded"
- ❌ Don't: Modal dialogs after every grade ("Great job grading that assignment!")

**For Administrators (Informative):**
- ✅ System alerts for critical issues (error rates spike, downtime detected)
- ✅ Daily digest email with key metrics (not real-time interruptions for non-critical events)
- ✅ Dashboard shows health status at a glance (green/yellow/red indicators)

**Principle Application Matrix:**

| User Type | Speed | Guidance | Flexibility | Feedback |
|-----------|-------|----------|-------------|----------|
| **Student** | Resume course in 1 click | Clear next steps visible | Standard LMS patterns | Celebratory milestones |
| **Instructor** | Inline editing, keyboard shortcuts | Batch operations clear | Familiar grid/table patterns | Minimal interruptions |
| **Admin** | Quick user creation (<5 min) | Dashboard shows status | Standard admin panels | Critical alerts only |

These principles prevent feature bloat, maintain professional quality, and ensure the platform serves its users' actual needs rather than designer creativity.

---

