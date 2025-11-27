# Development Guide - AI Gurus LMS

**Generated:** 2025-11-24
**Project:** AI Gurus LMS
**Framework:** Next.js 15.3.3
**Package Manager:** npm

---

## Prerequisites

### Required Software
- **Node.js:** v20.x or higher
- **npm:** v9.x or higher (comes with Node.js)
- **Git:** Latest version

### Optional (Recommended)
- **VS Code:** With TypeScript and Prisma extensions
- **Prisma Studio:** Visual database editor (built-in)

---

## Initial Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd ai-gurus-lms
```

### 2. Install Dependencies
```bash
npm install
```

**What this does:**
- Installs all packages from package.json
- Downloads ~340+ dependencies
- Takes 2-5 minutes depending on connection

### 3. Environment Setup

Create `.env` file in project root:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Optional: For production
# DATABASE_URL="postgresql://user:password@localhost:5432/lmsdb"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Database Setup

#### Initialize Database
```bash
npx prisma generate
npx prisma db push
```

**What this does:**
- Generates Prisma Client
- Creates SQLite database (dev.db)
- Creates all tables from schema

#### (Optional) Seed Database
```bash
# Create seed script first (not included)
# Then run:
npx prisma db seed
```

#### View Database
```bash
npx prisma studio
```
Opens visual database editor at http://localhost:5555

---

## Development Workflow

### Run Development Server

#### Main Application Only
```bash
npm run dev
```
- Starts Next.js dev server on http://localhost:3000
- Hot module replacement enabled
- TypeScript checking in IDE

#### Both Applications (Main + Vibe Code)
```bash
npm run dev:both
```
- **AI-Fluency:** http://localhost:3000
- **Vibe-Code:** http://localhost:3001
- Runs concurrently with colored logs

**Output:**
```
[AI-Fluency] ✓ Ready on http://localhost:3000
[Vibe-Code] ✓ Ready on http://localhost:3001
```

---

## Build & Production

### Build for Production
```bash
npm run build
```

**What this does:**
- Compiles TypeScript
- Bundles JavaScript
- Optimizes assets
- Generates .next/ folder
- Takes 30-60 seconds

### Run Production Build Locally
```bash
npm run start:prod
```
Starts production server on http://localhost:3000

### Build Both Applications
```bash
npm run build:both
```
Builds main app + vibe-code-lms

### Start Both in Production
```bash
npm run start:both
```
Runs both apps in production mode

---

## Code Quality

### Linting
```bash
npm run lint
```

**Checks:**
- TypeScript errors
- ESLint rules
- React hooks rules
- Next.js specific rules

**Fix auto-fixable issues:**
```bash
npm run lint -- --fix
```

---

## Database Management

### View Current Schema
```bash
npx prisma format
```
Formats schema.prisma file

### Create Migration (for PostgreSQL)
```bash
npx prisma migrate dev --name description-of-change
```

### Reset Database (⚠️ Deletes all data)
```bash
npx prisma migrate reset
```

### Update Prisma Client (after schema changes)
```bash
npx prisma generate
```

---

## Project Structure

```
ai-gurus-lms/
├── .next/                # Build output (gitignored)
├── node_modules/         # Dependencies (gitignored)
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── dev.db            # SQLite database (dev)
├── public/               # Static assets
│   ├── images/
│   └── ...
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (routes)/     # Page routes
│   │   ├── api/          # API routes
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── Navbar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ...
│   ├── lib/              # Utility functions
│   │   └── prisma.ts     # Prisma client
│   └── types/            # TypeScript types
├── vibe-code-lms/        # Separate LMS instance
├── .env                  # Environment variables (gitignored)
├── .env.local            # Local overrides (gitignored)
├── .gitignore
├── next.config.js        # Next.js configuration
├── package.json          # Dependencies & scripts
├── tailwind.config.js    # Tailwind CSS config
├── tsconfig.json         # TypeScript config
└── README.md
```

---

## Common Development Tasks

### Create New Page
1. Create file in `src/app/your-route/page.tsx`
2. Export default component
3. Use Server Component (default) or add 'use client'

**Example:**
```tsx
// src/app/new-page/page.tsx
export default function NewPage() {
  return <div>Hello World</div>
}
// Accessible at /new-page
```

### Create New API Route
1. Create file in `src/app/api/your-route/route.ts`
2. Export GET, POST, PUT, DELETE handlers

**Example:**
```tsx
// src/app/api/hello/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Hello!' })
}
```

### Add New Database Model
1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` (dev)
3. Run `npx prisma generate`
4. Update types if needed

### Add New Component
1. Create in `src/components/ComponentName.tsx`
2. Use TypeScript for props
3. Import and use in pages

---

## Testing

### Current State
⚠️ **No test suite currently implemented**

### Recommended Setup

#### Install Testing Libraries
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

#### Add Test Script
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

#### Create jest.config.js
```js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

---

## Debugging

### Server-Side Debugging
Add breakpoints in VS Code or use:
```tsx
console.log('Debug:', variable)
```

### Client-Side Debugging
Use browser DevTools:
- Chrome DevTools (F12)
- React DevTools extension
- Network tab for API calls

### Database Debugging
```bash
npx prisma studio
```
Visual interface to view/edit data

### Common Issues

**Issue:** "Module not found" errors
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Issue:** Database schema out of sync
**Solution:**
```bash
npx prisma generate
npx prisma db push
```

**Issue:** Port 3000 already in use
**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
npm run dev -- -p 3001
```

---

## Environment Variables

### Required Variables
```env
DATABASE_URL           # Database connection string
NEXTAUTH_SECRET        # JWT secret key
NEXTAUTH_URL           # Application base URL
```

### Optional Variables
```env
# File Upload
MAX_FILE_SIZE=209715200  # 200MB in bytes

# Email (if implemented)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password

# Production Database
DIRECT_URL=postgresql://...  # For migrations
```

---

## Deployment Preparation

### Pre-Deployment Checklist

1. **Environment Setup**
   - [ ] Set production DATABASE_URL (PostgreSQL)
   - [ ] Generate new NEXTAUTH_SECRET
   - [ ] Configure NEXTAUTH_URL with production domain

2. **Database Migration**
   - [ ] Export data from SQLite
   - [ ] Set up PostgreSQL database
   - [ ] Run migrations: `npx prisma migrate deploy`

3. **Build Verification**
   - [ ] Run `npm run build` successfully
   - [ ] Test production build locally
   - [ ] Check for build warnings

4. **Security**
   - [ ] Remove .env from repository
   - [ ] Update CORS settings if needed
   - [ ] Configure rate limiting

5. **Performance**
   - [ ] Optimize images
   - [ ] Enable compression
   - [ ] Configure CDN for static assets

### Deployment Platforms

#### Vercel (Recommended for Next.js)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Docker
```dockerfile
# Dockerfile example
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Performance Optimization

### Development
- Use React DevTools Profiler
- Monitor bundle size with `next/bundle-analyzer`
- Lazy load heavy components

### Production
- Enable Next.js Image Optimization
- Implement ISR (Incremental Static Regeneration)
- Use CDN for static assets
- Implement caching headers

---

## Git Workflow

### Branch Strategy
```bash
main        # Production
develop     # Development
feature/*   # Feature branches
bugfix/*    # Bug fixes
hotfix/*    # Production hotfixes
```

### Commit Convention
```
feat: Add new assignment upload feature
fix: Resolve course enrollment bug
docs: Update API documentation
style: Format code with Prettier
refactor: Simplify grade calculation logic
test: Add tests for submission endpoint
chore: Update dependencies
```

---

## Helpful Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- NextAuth: https://next-auth.js.org
- Tailwind CSS: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org/docs

### Tools
- Prisma Studio: Visual database editor
- React DevTools: Chrome extension
- Next.js DevTools: Built into dev server

---

## Troubleshooting

### Hot Reload Not Working
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### TypeScript Errors
```bash
# Restart TypeScript server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Database Connection Issues
```bash
# Check DATABASE_URL in .env
# Regenerate Prisma Client
npx prisma generate
```

---

**Last Updated:** 2025-11-24
**Next.js Version:** 15.3.3
**Node Version:** 20+
**Package Manager:** npm

---

**Generated by:** BMM Document Project Workflow
**For questions:** Refer to Next.js and Prisma documentation
