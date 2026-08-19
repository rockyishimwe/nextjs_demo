# ADR-001: Clerk over Auth.js for Authentication

## Status

Accepted

## Context

DevEvent needs user authentication for:
- Admin event management (create, edit, delete)
- Booking events with email tracking
- Protecting admin routes and API endpoints

We evaluated:
- **Clerk** — hosted auth service with React/Next.js SDK
- **Auth.js** (formerly NextAuth.js) — open-source, self-hosted auth
- **Firebase Auth** — Google's auth service
- **Supabase Auth** — included with Supabase

## Decision

We chose **Clerk** for the following reasons:

### Pros of Clerk
- **Minimal setup** — `clerk init` scaffolds the entire auth flow
- **Pre-built UI components** — `SignInButton`, `SignUpButton`, `UserButton` work out of the box
- **Server-side auth** — `auth()` helper returns the current user in Server Components
- **Middleware integration** — automatic session management
- **User management dashboard** — view users, manage sessions, handle support
- **Free tier** — 10,000 monthly active users (sufficient for launch)
- **SSO/OAuth support** — built-in Google, GitHub, etc.

### Cons of Auth.js
- **More setup** — requires configuring providers, callbacks, session strategy
- **Less polished UI** — no built-in components, must build custom login forms
- **Database dependency** — needs a database adapter for session storage
- **Documentation** — can be confusing with multiple versions (v4 vs v5)

## Consequences

### Positive
- Auth was set up in ~30 minutes
- Clean server-side checks with `auth()` in layout and API routes
- User management handled by Clerk dashboard
- No session database to manage

### Negative
- **Vendor lock-in** — switching away from Clerk would require rewriting auth
- **Cost at scale** — free tier ends at 10k MAU, then $0.02/MAU
- **Development keys warning** — console warns about using dev keys (cosmetic)
- **External dependency** — Clerk outage means no auth

### Mitigations
- Auth logic is abstracted in `lib/admin.ts` — only this file touches Clerk directly
- If we outgrow Clerk, we can swap the implementation without changing components
- Clerk has 99.99% uptime SLA on paid plans

## Alternatives Considered

| Criteria | Clerk | Auth.js | Firebase | Supabase |
|----------|-------|---------|----------|----------|
| Setup time | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| UI components | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Free tier | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Self-hosted option | ❌ | ✅ | ❌ | ✅ |
| Next.js integration | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## References

- [Clerk Next.js Docs](https://clerk.com/docs/nextjs/getting-started)
- [Auth.js Next.js Docs](https://authjs.dev/getting-started/installation)
