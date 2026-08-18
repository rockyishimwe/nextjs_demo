# DevEvent

A full-stack event management platform for developer conferences, hackathons, and meetups. Browse upcoming events, book your spot, and manage events through a secure admin dashboard.

**Live Stack:** Next.js 16 · MongoDB · Clerk Auth · Cloudinary · PostHog · Resend

## Features

- **Public site** — browse events with formatted dates, detail pages with agenda/tags/overview, and one-click booking
- **Admin dashboard** — create, edit, and delete events with image upload, capacity limits, search, and a bookings viewer
- **Authentication** — Clerk-powered sign-in/sign-up with owner-only admin gating
- **Booking system** — anti-duplicate (one booking per email), capacity enforcement, email confirmations via Resend
- **Analytics** — PostHog pageview tracking and booking event capture
- **SEO** — dynamic sitemap, OpenGraph metadata per event page

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys (see Environment Variables below)

# 3. Seed demo events into MongoDB
npm run seed

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `CLERK_ADMIN_USER_ID` | Optional | Restricts admin to one Clerk user (find at dashboard.clerk.com → Users). Leave empty in dev to allow any signed-in user. |
| `CLOUDINARY_URL` | ✅ | Cloudinary URL for image uploads |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | PostHog project key for analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional | PostHog host (default: `https://us.i.posthog.com`) |
| `RESEND_API_KEY` | Optional | Resend API key for booking confirmation emails |
| `EMAIL_FROM` | Optional | Sender address for emails (default: `DevEvent <onboarding@resend.dev>`) |
| `NEXT_PUBLIC_BASE_URL` | ✅ | App URL (e.g. `http://localhost:3000` or `https://devevent.app`) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run seed` | Seed demo events (idempotent — updates existing, creates new) |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Project Structure

```
app/
  admin/          # Admin pages (dashboard, create, edit, bookings)
  api/events/     # REST API (GET, POST, PATCH)
  database/       # Mongoose models (Event, Booking)
  events/         # Public pages (browse, detail)
  sign-in/        # Clerk auth pages
components/       # React components (forms, tables, cards)
lib/
  actions/        # Server actions (events, bookings)
  admin.ts        # Admin authorization helper
  email.ts        # Resend email dispatch
  format.ts       # Shared date/time formatters
  rateLimiter.ts  # In-memory rate limiter
  mongodb.ts      # Cached MongoDB connection
scripts/          # Seed script
```

## Deploying

1. Create a production Clerk instance and swap the keys
2. Set all env vars in your hosting platform (Vercel, Railway, etc.)
3. Run `npm run seed` against production DB to populate events
4. Deploy with `npm run build && npm start`

## License

MIT
