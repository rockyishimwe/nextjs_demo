# ADR-003: API Routes vs Server Actions for Data Mutations

## Status

Accepted

## Context

DevEvent has two types of data mutations:
1. **UI-driven mutations** — form submissions from React components (create event, book event, delete event)
2. **External API consumers** — third-party tools or future mobile apps that need programmatic access

We needed to decide how to expose these mutations.

## Decision

We use **both** — Server Actions for UI mutations and API Routes for external consumers.

### Server Actions (UI Mutations)
- `createBooking` — booking form → server action
- `deleteEvent` — admin delete button → server action
- `getAdminEvents` — admin table data → server action
- `getPublicEvents` — public browse page → server action

### API Routes (REST API)
- `POST /api/events` — create event (admin)
- `GET /api/events` — list events (public)
- `GET /api/events/[slug]` — get event (public)
- `PATCH /api/events/[slug]` — update event (admin)

## Why Both?

### Server Actions for UI
- **Simpler** — no fetch/axios, no error handling boilerplate
- **Type-safe** — parameters and return types are inferred
- **Automatic revalidation** — `revalidatePath` works seamlessly
- **Progressive enhancement** — forms work without JavaScript
- **Caching** — integrates with `unstable_cache`

### API Routes for External Access
- **Standard HTTP** — any client can consume (mobile, scripts, third-party)
- **Rate limiting** — per-IP limits via Upstash Redis
- **Cache headers** — `Cache-Control` for CDN/proxy caching
- **Documentation** — documented in `docs/api.md`
- **Versioning** — can add `/api/v2/` without breaking UI

## Consequences

### Positive
- UI gets the best DX with Server Actions
- External consumers get a stable REST API
- Shared validation logic in `lib/event-form-validation.ts` is used by both
- Rate limiting only on API routes (Server Actions are protected by Clerk session)

### Negative
- **Duplicate endpoints** — same operation available via action and API
- **Sync overhead** — changes to one must be reflected in the other
- **Documentation burden** — API routes need explicit docs, actions don't

### Mitigations
- Shared validation layer reduces duplication
- API routes are thin wrappers around the same Mongoose operations
- Server Actions are for internal use only — not documented as public API

## References

- [Next.js Server Actions](https://next.dev/reference/functions/server-actions)
- [Next.js Route Handlers](https://next.dev/app/building-your-application/routing/route-handlers)
