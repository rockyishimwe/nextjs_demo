# Contributing to DevEvent

Welcome! This guide will help you get started with developing DevEvent.

## Prerequisites

- **Node.js** 20+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **MongoDB** instance (local or MongoDB Atlas)
- **Clerk** account (for authentication)
- **Cloudinary** account (for image uploads)

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/devevent.git
   cd devevent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Then fill in your credentials (see `.env.example` for required variables).

4. **Seed the database:**
   ```bash
   npm run seed
   ```

5. **Start the dev server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Code Conventions

### Formatting
- **Prettier** is configured with 2 spaces, double quotes, trailing commas
- Run `npm run format` to auto-format all files
- Run `npm run format:check` to verify formatting

### Linting
- **ESLint** is configured for Next.js + TypeScript
- Run `npm run lint` to check for issues
- Run `npm run lint:fix` to auto-fix

### TypeScript
- Run `npm run typecheck` to verify types
- All source files should have proper type annotations

### File Naming
- **Components:** PascalCase (e.g., `EventCard.tsx`)
- **Pages/Routes:** kebab-case (e.g., `create-event/page.tsx`)
- **Lib/Actions:** camelCase (e.g., `event.actions.ts`)
- **Database Models:** camelCase (e.g., `event.model.ts`)

### Component Patterns
- Use `"use client"` only when needed (interactivity, hooks)
- Server components by default for better performance
- Props interfaces defined in the same file as the component

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/                # REST API routes
│   ├── admin/              # Admin dashboard (protected)
│   ├── events/             # Public event pages
│   └── _components/        # App-specific components
├── components/             # Shared React components
├── lib/                    # Utilities, actions, helpers
│   ├── actions/            # Server actions
│   └── ...
├── public/                 # Static assets
├── scripts/                # Build/seed scripts
└── docs/                   # Documentation
```

## Development Workflow

### Branch Naming
- `feature/description` — new features
- `fix/description` — bug fixes
- `docs/description` — documentation changes

### Commit Messages
- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Keep commits focused and atomic

### Pull Requests
1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run typecheck && npm run lint && npm run build`
4. Push and create a PR
5. Describe what changed and why

### Testing Your Changes
- **Typecheck:** `npm run typecheck`
- **Lint:** `npm run lint`
- **Build:** `npm run build`
- **Manual testing:** Sign in, create events, test booking flow

## Architecture Overview

- **Next.js 16** with App Router and Turbopack
- **Clerk** for authentication (server-side auth checks)
- **MongoDB** with Mongoose ODM
- **Cloudinary** for image uploads
- **Tailwind CSS** for styling
- **PostHog** for analytics

### Key Patterns
- **Server Actions** for form mutations (UI → server)
- **API Routes** for external consumers and complex operations
- **Atomic booking** with MongoDB `findOneAndUpdate` to prevent race conditions
- **Rate limiting** via Upstash Redis (production) or in-memory (development)

## Questions?

Open an issue or reach out to the maintainers.
