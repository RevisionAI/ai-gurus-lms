# UI Component Inventory - AI Gurus LMS

**Generated:** 2025-11-24
**Project:** AI Gurus LMS
**UI Framework:** React 19
**Component Location:** `src/components/`
**Design System:** Radix UI + Custom Components
**Styling:** Tailwind CSS 4

---

## Component Categories

### 1. Navigation Components

#### Navbar
**Location:** `src/components/Navbar.tsx`
**Purpose:** Main navigation bar with role-based menu items
**Features:**
- Role-based navigation (Student/Instructor/Admin)
- Responsive mobile menu
- User profile dropdown
- Sign out functionality
**Dependencies:** NextAuth session, Lucide icons

#### Breadcrumb
**Location:** `src/components/Breadcrumb.tsx`
**Purpose:** Hierarchical navigation breadcrumbs
**Features:**
- Dynamic path generation
- Clickable navigation history
- Current page highlighting

---

### 2. Dashboard Components

#### StudentDashboard
**Location:** `src/components/StudentDashboard.tsx`
**Purpose:** Student dashboard view
**Features:**
- Enrolled courses grid
- Upcoming assignments list
- Recent announcements feed
- Overall GPA display (placeholder)
**Data Loading:** Real-time via API

#### InstructorDashboard
**Location:** `src/components/InstructorDashboard.tsx`
**Purpose:** Instructor dashboard view
**Features:**
- Course statistics cards
- Quick actions menu
- Recent assignments overview
- Pending grades count
**Data Loading:** Real-time via API

#### AdminDashboard
**Location:** `src/components/AdminDashboard.tsx`
**Purpose:** Admin dashboard view
**Features:**
- System statistics
- User management links
- Course management overview
**Data Loading:** Admin stats API

---

### 3. Authentication & Access Control

#### ProtectedRoute
**Location:** `src/components/ProtectedRoute.tsx`
**Purpose:** Route authentication and authorization wrapper
**Features:**
- Session validation
- Role-based access control
- Redirect to login if unauthorized
- Loading states
**Usage:** Wraps protected pages

---

### 4. Content & Forms

#### RichTextEditor
**Location:** `src/components/RichTextEditor.tsx`
**Purpose:** WYSIWYG rich text editor
**Technology:** TinyMCE 7.9.1
**Features:**
- Full formatting toolbar
- Image upload
- Link insertion
- Code blocks
- Tables
**Use Cases:** Announcements, discussions, course content

---

### 5. Layout Components

#### Page Layouts
**Patterns:**
- Dashboard layout (grid-based)
- Course detail layout (tabbed interface)
- Form layouts (centered, responsive)
- List layouts (cards, tables)

**Common Patterns:**
- Loading states with skeletons
- Error boundaries
- Toast notifications (react-hot-toast)
- Modal dialogs (Radix UI)
- Dropdown menus (Radix UI)

---

## Design System Elements

### Typography
- **Headings:** h1-h6 with consistent sizing
- **Body:** Default text, muted text, small text
- **Font Family:** System font stack

### Colors
- **Primary:** Blue gradient accents
- **Background:** White, gray-50
- **Text:** Gray-900 (primary), Gray-600 (muted)
- **Status:**
  - Success: Green-500
  - Error: Red-500
  - Warning: Yellow-500
  - Info: Blue-500

### Spacing
- Tailwind spacing scale (4px base unit)
- Consistent padding: p-4, p-6, p-8
- Consistent margins: mb-4, mb-6, mb-8
- Gap utilities for flex/grid

### Interactive Elements

#### Buttons
**Variants:**
- Primary: Blue background, white text
- Secondary: White background, blue text
- Danger: Red background, white text
- Ghost: Transparent background

**Sizes:**
- Small: px-3 py-1.5 text-sm
- Medium: px-4 py-2
- Large: px-6 py-3 text-lg

#### Input Fields
**Types:**
- Text inputs
- Text areas
- Select dropdowns
- File uploads
- Date pickers

**States:**
- Default
- Focus (blue ring)
- Error (red border)
- Disabled (gray background)

#### Cards
**Pattern:**
- White background
- Border or shadow
- Padding: p-6
- Rounded corners
- Hover states (for clickable cards)

---

## Page-Specific Component Patterns

### Course Detail Tabs
**Location:** `src/app/courses/[id]/page.tsx`
**Components:**
- Overview tab (description, instructor, enrollment)
- Content tab (course materials list)
- Assignments tab (assignment list)
- Discussions tab (forum threads)
- Announcements tab (announcement feed)

**Pattern:** Radix UI Tabs component

### Assignment Submission Form
**Components:**
- Rich text editor (submission content)
- File upload dropzone
- Submit button with loading state
- Validation error display

### Discussion Thread
**Components:**
- Post list (nested replies)
- Reply form (per-post)
- Author avatars
- Timestamp display
- Edit/delete actions (author only)

### Content Management
**Components:**
- Drag-and-drop reordering (@dnd-kit)
- Content type selector (dropdown)
- YouTube URL input with thumbnail fetch
- File upload with progress
- Publish/unpublish toggle

---

## Reusable UI Patterns

### Loading States
```tsx
// Skeleton loading
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
</div>

// Spinner
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
```

### Empty States
```tsx
<div className="text-center py-12">
  <Icon className="mx-auto h-12 w-12 text-gray-400" />
  <p className="mt-2 text-gray-500">No items found</p>
  <Button className="mt-4">Create New</Button>
</div>
```

### Error States
```tsx
<div className="bg-red-50 border border-red-200 rounded p-4">
  <p className="text-red-800">Error message here</p>
</div>
```

### Toast Notifications
**Library:** react-hot-toast
**Usage:**
```tsx
toast.success("Assignment submitted!")
toast.error("Failed to save changes")
```

---

## Third-Party Component Libraries

### Radix UI Primitives
**Used Components:**
- `@radix-ui/react-dialog` - Modal dialogs
- `@radix-ui/react-dropdown-menu` - Dropdown menus
- `@radix-ui/react-tabs` - Tabbed interfaces

**Benefits:**
- Accessible by default
- Unstyled (fully customizable)
- Composable

### @dnd-kit
**Purpose:** Drag-and-drop functionality
**Used For:**
- Course content reordering
- Sortable lists

**Components:**
- DndContext
- SortableContext
- useSortable hook

### Lucide React
**Purpose:** Icon library
**Usage:** Consistent icons throughout app
**Examples:** Menu, User, FileText, Calendar, etc.

---

## Responsive Design Patterns

### Breakpoints (Tailwind)
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px
- `2xl:` 1536px

### Mobile-First Approach
- Base styles for mobile
- Progressive enhancement with breakpoint prefixes
- Responsive navigation (hamburger menu on mobile)
- Responsive grids (1 col → 2 cols → 3 cols)

---

## Component Best Practices

### 1. Server vs Client Components
- **Server Components (default):** Static content, data fetching
- **Client Components ('use client'):** Interactive elements, hooks, browser APIs

### 2. Data Fetching
- Server Components: Direct Prisma queries
- Client Components: API route calls with loading states

### 3. Form Handling
- Controlled inputs with useState
- Form validation before submission
- Error display per field
- Success/error toast notifications

### 4. Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Color contrast compliance

---

## Missing Components / Opportunities

1. **Reusable Form Components**
   - FormInput, FormTextarea, FormSelect wrappers
   - Form validation utilities

2. **Data Table Component**
   - Sortable columns
   - Pagination
   - Search/filter
   - Bulk actions

3. **Avatar Component**
   - User profile images
   - Fallback initials
   - Different sizes

4. **Badge Component**
   - Status indicators
   - Role badges
   - Count badges

5. **Progress Bar**
   - Course completion tracking
   - File upload progress
   - Loading progress

6. **Chart Components**
   - Grade distribution charts
   - Course analytics
   - Student progress charts

---

## Component Documentation Standards

**Recommended Addition:**
Add JSDoc comments to components:
```tsx
/**
 * Navbar component with role-based navigation
 * @param {Object} props
 * @param {User} props.user - Current user session
 * @returns {JSX.Element}
 */
export function Navbar({ user }: NavbarProps) {
  // ...
}
```

---

## Future Enhancements

1. **Storybook Integration**
   - Component playground
   - Visual regression testing
   - Design system documentation

2. **Component Library Extraction**
   - Separate reusable components
   - Publish as internal package
   - Share across multiple LMS instances

3. **Design Tokens**
   - Centralize colors, spacing, typography
   - Generate from Tailwind config
   - Consistent theming system

4. **Dark Mode Support**
   - Theme provider
   - Dark mode variants
   - User preference persistence

---

**Total Components:** ~15-20 (exact count varies by definition)
**Design System:** Custom (Tailwind + Radix)
**Accessibility:** WCAG AA target
**Mobile Support:** Responsive (mobile-first)
**Browser Support:** Modern browsers (ES2020+)

---

**Generated by:** BMM Document Project Workflow
**Next Review:** Before adding new UI features
