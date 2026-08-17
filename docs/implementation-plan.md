# Implementation Plan — Review Hardening Pass

Corrects every issue from the full code review (August 2026, branch `main`).
Each item: **Files → Approach → Edge cases → Verify**. Items are independent;
do them in phase order. After each phase run:

```bash
npx tsc --noEmit && npx eslint . && npm run build
```

**Branch strategy:** work on `fix/review-hardening` (from `main`), one commit per
phase so the PR stays reviewable, e.g.:
`fix: harden admin gate and image uploads`, `fix: make bookings race-proof`,
`fix: stabilize slugs and dedupe /events`, `chore: cleanup and polish`.

---

## Phase 0 — Setup

- [ ] Create branch `fix/review-hardening` from `main`.
- [ ] Baseline: `npx tsc --noEmit && npx eslint . && npm run build` — must pass before starting.

---

## Phase 1 — Security (critical, do first)

### 1.1 Fail-closed admin check

**Files:** `lib/admin.ts`, `.env.example`

**Approach:** `isAdmin()` currently returns `true` for any signed-in user when
`CLERK_ADMIN_USER_ID` is unset (`return !adminId || userId === adminId`). Change
to fail closed:

```ts
const adminId = process.env.CLERK_ADMIN_USER_ID;
if (!adminId) return process.env.NODE_ENV === "development"; // dev-only convenience
return userId === adminId;
```

Add `CLERK_ADMIN_USER_ID=` to `.env.example` with a comment: set to your Clerk
user ID; when unset, admin access is only possible in local development.

**Edge cases:** env var typo'd in prod → admin access denied (safe direction);
multiple admins later → swap to `publicMetadata.role` array (documented in comment).

**Verify:** without the env var, a `next build`-served app denies all admin
routes; with it set, only that user passes. `curl -X POST /api/events` as
non-admin → 401.

### 1.2 Server-side image validation

**Files:** `lib/event-form-validation.ts`, `app/api/events/route.ts`,
`app/api/events/[slug]/route.ts`

**Approach:**
- Constants: `MAX_IMAGE_SIZE = 5 * 1024 * 1024` and
  `ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]`
  (deliberately **no SVG** — it can carry scripts).
- New `validateImageFile(file: File): Promise<Buffer>`:
  1. `file.size <= 0` → throw `ValidationError` (empty file).
  2. `file.size > MAX_IMAGE_SIZE` → throw **before** buffering (`file.size` is
     known without reading the body).
  3. `file.type` not in allowlist → throw.
  4. `await file.arrayBuffer()`, then **sniff magic bytes** — MIME header is
     client-supplied and spoofable:
     - JPEG: `FF D8 FF`
     - PNG: `89 50 4E 47`
     - GIF: `GIF8`
     - WebP: `RIFF` at 0 + `WEBP` at 8
     - AVIF: `ftypavif` / `ftypavis` at offset 4
  5. Return the `Buffer` so the route uploads it directly (no double buffering).
- `uploadEventImageToCloudinary` takes the validated `Buffer` instead of a `File`.
- POST: required image (already) — call `validateImageFile` before upload.
- PATCH: in the `if (file && file.size > 0)` branch, validate first — a
  spoofed/oversized file must **400**, not silently keep the old image.

**Edge cases:** empty file, 6 MB file (rejected before any memory pressure),
`.txt` renamed to `.png` (caught by magic bytes), SVG (excluded).

**Verify:** `curl -F image=@evil.txt ...` → 400; `curl -F image=@big.png` (6 MB)
→ 400; valid PNG → 201/200.

### 1.3 Stop leaking error internals

**Files:** `app/api/events/route.ts` (POST + GET),
`app/api/events/[slug]/route.ts` (GET + PATCH)

**Approach:** every 500 currently returns `error: e.message` — this surfaces
Mongo URIs, E11000 detail, Cloudinary internals. Remove the `error` field from
all four response bodies; keep `console.error` server-side. Optionally add a
coarse `code` field (`"DB_ERROR" | "UNEXPECTED"`) for client diagnostics.

**Edge cases:** keep the existing 400 paths for `ValidationError` and
Cloudinary-config errors; Mongoose validation handled separately in 2.3.

**Verify:** force an error (e.g. stop Mongo) and confirm the response body
contains no connection string / stack detail; grep for `error:` in the routes
returns nothing.

### 1.4 Bookings: race-proof + rate limit

**Files:** `app/database/booking.model.ts`, `lib/actions/booking.actions.ts`,
`app/database/event.model.ts`, `scripts/backfill-bookings-count.mjs` (new)

**Approach:**
- **Duplicate bookings — make it atomic at the DB level.** Add a compound
  **unique index** `BookingSchema.index({ eventId: 1, email: 1 }, { unique: true })`.
  In `createBooking`, drop the find-then-create; catch Mongo duplicate-key
  (code `11000` / `E11000`) and return `"You've already booked this event."`.
- **Capacity — atomic check-and-increment.** Add `bookingsCount: { type: Number, default: 0 }`
  to `Event`. Replace `countDocuments` + `create` with:

  ```ts
  const event = await Event.findOneAndUpdate(
    { _id: eventId, $expr: { $lt: ["$bookingsCount", "$capacity"] } },
    { $inc: { bookingsCount: 1 } },
  );
  if (!event) return { success: false, message: "This event is fully booked." };
  ```

  Only create the booking after the increment succeeds. Backfill existing
  bookings with a small script (`Booking.aggregate` group by `eventId` →
  `Event.updateOne` set `bookingsCount`). Note: transactions are an alternative
  but require a replica set (Atlas: yes; local standalone: no), so the counter
  is the portable choice.
- **Rate limit the action.** `createBooking` has no Request object — pull the
  IP from `headers()` (`next/headers`, `x-forwarded-for`, set by the platform)
  and limit e.g. `10/min/IP` and `5/min/email` with `rateLimit`.
- Remove the now-dead `slug` param from `createBooking` if nothing uses it
  (see 3.4).

**Edge cases:** concurrent identical submits → exactly one booking (unique
index); concurrent capacity oversell → exactly `capacity` bookings (atomic
`$inc`); `bookingMap` on the admin table still works via aggregate.

**Verify:** fire 10 parallel `createBooking` with the same email → 1 booking and
friendly duplicate message on the rest; 11th+ request per IP → rate-limited;
fill an event to capacity → "fully booked" with no oversell.

### 1.5 Stop sending booking emails to PostHog

**Files:** `components/BookEvent.tsx`

**Approach:** remove `email` from the `posthog.capture('event_booked', ...)`
payload — keep `eventId` + `slug`. Also fix `posthog.captureException(...)`:
it expects an `Error` and it currently fires on *expected* failures ("already
booked", "full"). Only capture exceptions for unexpected errors, passing an
`Error`.

**Verify:** grep `components/` — no `email` inside any `posthog.*` call.

### 1.6 Rate-limit GET /api/events/[slug]

**File:** `app/api/events/[slug]/route.ts`

**Approach:** mirror the list route — `rateLimit(\`get-slug:${ip}\`, 60, 60_000)`
before the DB work, same 429 shape with `Retry-After` / `X-RateLimit-Remaining`.

**Verify:** 61 rapid requests → 429 with `Retry-After`.

### 1.7 Document the IP trust model

**File:** `lib/rateLimiter.ts`

**Approach:** `getClientIp` trusts the first `x-forwarded-for` hop, which is
only safe behind the platform proxy (Vercel overwrites it). Add a comment
documenting this; optionally read the *last* hop when a `TRUST_PROXY=true` env
var is set for self-hosted deployments.

**Verify:** behavior unchanged on Vercel; comment explains the trade-off.

---

## Phase 2 — Functional bugs

### 2.1 Dedupe `/events` and fix the navbar

**Files:** `app/events/page.tsx` (delete), `components/Navbar.tsx`,
`lib/actions/auth.actions.ts` (new)

**Approach:** `/events` is a byte-for-byte copy of `/admin` (the management
table). Decision: **delete `app/events/page.tsx`** and make `/admin` the single
management surface. The public event listing already lives on `/` (homepage).

`Navbar` is a client component and currently shows "Events" + "Create Event" to
every signed-in user. Add a `"use server"` action `getNavState()` in
`lib/actions/auth.actions.ts` that calls `isAdmin()` and returns a boolean;
have Navbar fetch it (via `useEffect` or a small wrapper) and render
"Manage Events" → `/admin` and "Create Event" only when admin. Anonymous users
already see only Sign In / Sign Up.

**Edge cases:** non-admin signed-in user sees neither admin link; direct URL
access to `/admin` is still blocked by the layout check.

**Verify:** logged out → no Events/Create links; admin → both links; non-admin
→ neither; `/events` returns 404 after deletion.

### 2.2 Stable slugs

**Files:** `app/database/event.model.ts`

**Approach:** currently the pre-save hook regenerates the slug whenever the
title changes (breaking bookmarks and leaving `Booking.slug` stale), `generateSlug`
can return `""` (title of only special chars → unique-index violation → 500),
and duplicate titles hit E11000 → 500.
- Generate the slug **only when `event.isNew`** — never on title change.
- Empty result from `generateSlug` → fallback `event-<random suffix>`.
- Collision handling on create: on duplicate key (E11000), retry with a `-2`,
  `-3`, … suffix (bounded, e.g. 5 attempts).

**Edge cases:** two events titled "Dev Meetup" → `dev-meetup` and `dev-meetup-2`,
both 201; editing "Dev Meetup" → slug stays `dev-meetup`.

**Verify:** create same-title events twice → distinct slugs; PATCH a title →
slug unchanged; create `"!!!"` as a title → non-empty slug, no 500.

### 2.3 Mongoose validation errors → 400

**Files:** `app/api/events/route.ts`, `app/api/events/[slug]/route.ts`

**Approach:** a 200-char title currently returns 500 with the leaked message.
In the catch blocks (after the custom `ValidationError` check), also handle
`e.name === "ValidationError"` (Mongoose) → 400 with the first validator
message, and the plain `Error`s thrown by the model hooks (`"Invalid date
format"`, `"Invalid time format"`) → 400.

**Verify:** POST a 200-char title → 400; bad date/time → 400; still no
internals in the body.

### 2.4 Fix the unstyled booking submit button

**Files:** `components/BookEvent.tsx`

**Approach:** `className="button-submit"` is referenced nowhere in
`globals.css` — the button renders unstyled. Rename to `className="submit"` to
pick up the existing `button.submit` style, which already ships a `:disabled`
state. While here, add a `submitting` state that disables the button during
`createBooking` (prevents double-submit).

**Verify:** button matches the site's primary button; disabled + "Submitting…"
while the request is in flight.

### 2.5 Escape the admin search regex

**File:** `lib/actions/event.actions.ts`

**Approach:** `getAdminEvents` interpolates the raw `q` into `$regex` — a query
like `(a+)+$` can cause catastrophic backtracking on the admin page. Escape
regex metacharacters before building the pattern (e.g. `q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`).

**Verify:** search for `a(b` matches literally; no ReDoS on pathological input.

### 2.6 Delete orphaned Cloudinary images

**Files:** `lib/event-form-validation.ts` (new helper),
`app/api/events/[slug]/route.ts` (PATCH), `lib/actions/event.actions.ts`
(deleteEvent)

**Approach:** images are never deleted when replaced or removed, so uploads
accumulate. Add `deleteCloudinaryImage(secureUrl)` that parses the `public_id`
from the URL (folder `DevEvent`) and calls `cloudinary.uploader.destroy` —
**best-effort, wrapped in try/catch, never fails the request**. Call it:
- PATCH: after a successful save with a new image, delete the old one.
- `deleteEvent`: delete the event's image after the DB delete.

**Verify:** replace an image → old one gone from the Cloudinary console
(manual); deleting an event frees its image; a failed destroy doesn't break the
response.

### 2.7 Harden parseJsonArray

**File:** `lib/event-form-validation.ts`

**Approach:** `["a", 123]` currently passes JSON parse and reaches Mongoose
unchecked. Validate that every element is a non-empty string, trim each, and
cap sizes: `tags` ≤ 10 items × ≤ 50 chars, `agenda` ≤ 20 items × ≤ 200 chars.

**Verify:** `["a", 123]` → 400; a 100k-item tags array → 400.

### 2.8 Per-event SEO metadata

**File:** `app/events/[slug]/page.tsx`

**Approach:** add `generateMetadata` that queries the event (title → `<title>`,
overview → description, image → OpenGraph) so every event page gets unique,
shareable metadata. The page is already dynamic, so the extra query is fine.

**Verify:** view-source on two event URLs shows distinct titles/descriptions.

---

## Phase 3 — Cleanup & polish

### 3.1 Stop tracking tooling metadata

**Files:** `.gitignore`, then `git rm --cached .freebuff/project-id`

**Approach:** `.freebuff/project-id` is committed but is editor tooling
metadata. Add `.freebuff/` to `.gitignore` and untrack the file.

**Verify:** `git status` clean after the removal; file stays on disk locally.

### 3.2 Documented deferrals (deliberately out of scope)

- **`date`/`time` stored as strings** — can't query "events this month" or sort
  by date. Fixing means schema migration + form + seed changes; defer unless a
  search/filter feature is on the roadmap.
- **`Booking.slug` dead field** — denormalized and never read (bookings are
  looked up by `eventId`). Remove in a follow-up once 1.4 touches the model.
- **In-memory rate limiter is per-instance** — fine for one instance; swap to
  `@upstash/ratelimit` when deploying multiple instances.

---

## Phase 4 — Final verification

- [ ] `npx tsc --noEmit && npx eslint . && npm run build` — all green.
- [ ] Manual smoke: create event (with image) → 201; duplicate title → distinct
  slug; edit title → slug unchanged; replace image → old one deleted; book →
  success; book again same email → friendly duplicate; fill capacity → "fully
  booked"; rapid-fire booking → rate-limited; non-admin POST → 401; anonymous
  `/admin` → sign-in redirect.
- [ ] Optional: add `vitest` (dev dep) and unit-test `validateImageFile` magic
  bytes + slug collision logic — no network/DB needed, CI-friendly.
- [ ] Commit per phase; open PR against `main`.
