# Implementation Plan — Full Review Hardening

Addresses every issue from the review. Each item: **Files → Approach → Edge cases → Verify**.
Run after each phase:
```bash
npx tsc --noEmit && npx eslint . && npm run build
```

**Branch:** `fix/review-hardening` from `main`, one commit per phase.

---

## Phase 1 — Critical security

### 1.1 Fail-closed isAdmin

**File:** `lib/admin.ts`

**Current:** `return !adminId || userId === adminId` — any signed-in user is admin when env var unset.

**Change:**
```ts
const adminId = process.env.CLERK_ADMIN_USER_ID;
if (!adminId) {
  if (!adminWarned) {
    adminWarned = true;
    console.warn("⚠ CLERK_ADMIN_USER_ID unset — denying admin in production.");
  }
  return process.env.NODE_ENV === "development";
}
return userId === adminId;
```

**Also:** add `CLERK_ADMIN_USER_ID=` to `.env.example` with a comment.

**Verify:** unset var → admin denied in prod build; with var → only that user passes.

### 1.2 Image upload validation

**File:** `lib/event-form-validation.ts`

**Add before `uploadEventImageToCloudinary`:**
```ts
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function validateImageFile(file: File): Promise<Buffer> {
  if (file.size <= 0) throw new ValidationError("Image file is empty");
  if (file.size > MAX_IMAGE_SIZE) {
    throw new ValidationError(`Image must be under ${MAX_IMAGE_SIZE / 1024 / 1024} MB`);
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new ValidationError("Image must be JPEG, PNG, WebP, GIF, or AVIF");
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // Magic-byte sniff (catches spoofed MIME)
  const header = buf.subarray(0, 12);
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng  = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  const isGif  = header.subarray(0, 4).toString() === "GIF8";
  const isWebp = header.subarray(0, 4).toString() === "RIFF" && header.subarray(8, 12).toString() === "WEBP";
  const isAvif = header.subarray(4, 8).toString() === "ftyp";

  if (!isJpeg && !isPng && !isGif && !isWebp && !isAvif) {
    throw new ValidationError("Image file content does not match its type");
  }

  return buf;
}
```

**Change `uploadEventImageToCloudinary`** to accept `Buffer` instead of `File`:
```ts
export async function uploadEventImageToCloudinary(buffer: Buffer): Promise<string> {
  // ... existing upload_stream logic using buffer directly
}
```

**In POST (`app/api/events/route.ts`):**
```ts
const buffer = await validateImageFile(file);
const secureUrl = await uploadEventImageToCloudinary(buffer);
```

**In PATCH (`app/api/events/[slug]/route.ts`):**
```ts
if (file && file.size > 0) {
  const buffer = await validateImageFile(file);
  image = await uploadEventImageToCloudinary(buffer);
}
```

**Edge cases:** empty file, 6 MB file (rejected before buffering), spoofed MIME (caught by magic bytes), SVG (excluded from allowlist).

**Verify:** `curl -F image=@evil.txt` → 400; `curl -F image=@big.png` (6 MB) → 400; valid PNG → 201/200.

### 1.3 Email HTML injection

**File:** `lib/email.ts`

**Add helper:**
```ts
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

**Wrap every interpolated value in the HTML template:**
```ts
html: `
  ... <strong>${escapeHtml(eventTitle)}</strong> ...
  ... ${escapeHtml(date)} at ${escapeHtml(time)} ...
  ... ${escapeHtml(venue)} ...
`
```

**Also escape `subject`:**
```ts
subject: `Registration Confirmed: ${escapeHtml(eventTitle)}`,
```

**Verify:** create event with title `<img src=x onerror=alert(1)>` → email shows literal text, no script.

---

## Phase 2 — Security hardening

### 2.1 PostHog fixes

**File:** `components/BookEvent.tsx`

**Remove `captureException` call** (line ~44) — it fires on expected user errors ("already booked", "fully booked") with a string instead of an Error. The toast already communicates the failure to the user.

**Keep only the success capture** (which already has no PII):
```ts
posthog.capture("event_booked", { eventId, slug });
```

**Verify:** grep `components/` — no `captureException` calls remain.

### 2.2 Document IP trust model

**File:** `lib/rateLimiter.ts`

**Add comment above `getClientIp`:**
```ts
/**
 * Extract a consistent client identifier from the request.
 *
 * Trust model: Vercel overwrites x-forwarded-for with the true client IP,
 * so taking the first hop is safe on that platform. If self-hosting behind
 * a trusted reverse proxy, ensure the proxy sets x-forwarded-for and
 * consider reading the last hop instead. On platforms that don't set
 * these headers, all clients share the "anonymous" bucket.
 */
```

**Verify:** no behavior change; comment explains the trade-off.

### 2.3 Rate-limit GET /api/events/[slug]

**File:** `app/api/events/[slug]/route.ts`

**Add to GET handler, before the DB work:**
```ts
export async function GET(req: NextRequest, { params }: RouteParams) {
  const ip = getClientIp(req);
  const rateCheck = rateLimit(`get-slug:${ip}`, 60, 60_000);
  if (!rateCheck.allowed) {
    return apiError("Too many requests. Please try again later.", 429);
  }
  // ... rest of handler
}
```

**Verify:** 61 rapid requests → 429 with Retry-After.

---

## Phase 3 — Functional fixes

### 3.1 button-submit → submit

**File:** `components/BookEvent.tsx`

**Change line ~56:**
```tsx
// Before
<button type="submit" className="button-submit">

// After
<button type="submit" className="submit">
```

The existing `button.submit` style in `globals.css:351` includes a `:disabled` state. While here, add `disabled={submitting}` to prevent double-submit (requires adding a `submitting` state variable).

**Verify:** button matches site primary style; disabled during request.

### 3.2 Stable slugs

**File:** `app/database/event.model.ts`

**Change pre-save hook:**
```ts
EventSchema.pre("save", async function () {
  const event = this as IEvent;

  // Generate slug only on create — never regenerate on title change
  if (event.isNew) {
    event.slug = generateSlug(event.title);
    if (!event.slug) {
      event.slug = `event-${Date.now().toString(36)}`;
    }
    // Handle collision: append -2, -3, ... up to 5 attempts
    const base = event.slug;
    for (let i = 2; i <= 6; i++) {
      const existing = await Event.findOne({ slug: event.slug }).select("_id").lean();
      if (!existing) break;
      event.slug = `${base}-${i}`;
    }
  }

  // date/time normalization stays the same
  if (event.isModified("date")) {
    event.date = normalizeDate(event.date);
  }
  if (event.isModified("time")) {
    event.time = normalizeTime(event.time);
  }
});
```

**Edge cases:** title `"!!!"` → `event-<timestamp>`; duplicate titles → `dev-meetup`, `dev-meetup-2`; editing title → slug unchanged.

**Verify:** create same-title events twice → distinct slugs; PATCH title → slug unchanged; create `"!!!"` → non-empty slug, no 500.

### 3.3 Escape admin search regex

**File:** `lib/actions/event.actions.ts`

**Add helper:**
```ts
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

**Use in getAdminEvents filter:**
```ts
if (query) {
  const safe = escapeRegex(query);
  filter.$or = [
    { title: { $regex: safe, $options: "i" } },
    { location: { $regex: safe, $options: "i" } },
    { venue: { $regex: safe, $options: "i" } },
    { mode: { $regex: safe, $options: "i" } },
  ];
}
```

**Verify:** search for `a(b` matches literally; no ReDoS on pathological input.

### 3.4 Hardening parseJsonArray

**File:** `lib/event-form-validation.ts`

**Replace the function:**
```ts
function parseJsonArray(
  formData: FormData,
  fieldName: string,
  opts: { maxItems?: number; maxItemLength?: number } = {},
): string[] {
  const { maxItems = 50, maxItemLength = 200 } = opts;
  const raw = formData.get(fieldName);

  if (!raw || (typeof raw === "string" && raw.trim() === "")) {
    throw new ValidationError(`"${fieldName}" is required`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw as string);
  } catch {
    throw new ValidationError(`"${fieldName}" must be a valid JSON array`);
  }

  if (!Array.isArray(parsed)) {
    throw new ValidationError(`"${fieldName}" must be a JSON array`);
  }

  if (parsed.length === 0) {
    throw new ValidationError(`"${fieldName}" must contain at least one item`);
  }

  if (parsed.length > maxItems) {
    throw new ValidationError(`"${fieldName}" must have at most ${maxItems} items`);
  }

  const validated: string[] = [];
  for (const item of parsed) {
    if (typeof item !== "string" || item.trim() === "") {
      throw new ValidationError(`"${fieldName}" items must be non-empty strings`);
    }
    const trimmed = item.trim();
    if (trimmed.length > maxItemLength) {
      throw new ValidationError(`"${fieldName}" items must be under ${maxItemLength} characters`);
    }
    validated.push(trimmed);
  }

  return validated;
}
```

**Update calls:**
```ts
const tags = parseJsonArray(formData, "tags", { maxItems: 10, maxItemLength: 50 });
const agenda = parseJsonArray(formData, "agenda", { maxItems: 20, maxItemLength: 200 });
```

**Verify:** `["a", 123]` → 400; 100-item tags array → 400; normal input → passes.

---

## Phase 4 — Cleanup

### 4.1 Cloudinary image deletion

**File:** `lib/event-form-validation.ts`

**Add helper:**
```ts
export async function deleteCloudinaryImage(secureUrl: string): Promise<void> {
  try {
    // Extract public_id from URL: .../DevEvent/filename.ext → DevEvent/filename
    const parts = secureUrl.split("/");
    const folderIdx = parts.findIndex((p) => p === "DevEvent");
    if (folderIdx === -1) return;
    const publicId = parts.slice(folderIdx).join("/").replace(/\.[^.]+$/, "");
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Best-effort: log but don't fail the request
    console.warn("Failed to delete Cloudinary image:", secureUrl);
  }
}
```

**In PATCH (`app/api/events/[slug]/route.ts`):** after successful save with new image:
```ts
if (file && file.size > 0) {
  const oldImage = existing.image;
  const buffer = await validateImageFile(file);
  image = await uploadEventImageToCloudinary(buffer);
  // Delete old image best-effort after successful upload
  await deleteCloudinaryImage(oldImage);
}
```

**In `deleteEvent` (`lib/actions/event.actions.ts`):** before DB delete:
```ts
await deleteCloudinaryImage(event.image);
```

**Verify:** replace image → old one gone from Cloudinary console; delete event → image freed; failed destroy doesn't break response.

### 4.2 Remove dead Booking.slug field

**Files:** `app/database/booking.model.ts`, `lib/actions/booking.actions.ts`

**In `booking.model.ts`:** remove the `slug` field from the schema and interface:
```ts
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**In `createBooking`:** remove `slug` from the `Booking.create` call:
```ts
await Booking.create({ eventId, email: normalizedEmail });
```

**Also remove `slug` from the function signature** (it's passed from BookEvent but never used in the DB).

**Verify:** build green; booking still works; `Booking.slug` no longer in schema.

### 4.3 Security headers

**File:** `next.config.ts`

**Add `headers` method:**
```ts
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
  ];
},
```

**Verify:** `curl -I` shows the headers on any page.

---

## Phase 5 — Final verification

- [ ] `npx tsc --noEmit && npx eslint . && npm run build` — all green.
- [ ] Manual smoke:
  - Create event (valid image) → 201
  - Create event (2 MB file) → 400
  - Create event (SVG) → 400
  - Create same-title events → distinct slugs
  - Edit title → slug unchanged
  - Book event → success, email sent
  - Book again same email → "already booked"
  - Fill capacity → "fully booked"
  - Rate-limit: 11 rapid GETs on slug → 429
  - Non-admin POST → 401
  - Anonymous `/admin` → sign-in redirect
- [ ] Commit per phase; open PR against `main`.

---

## Summary of changes by file

| File | Changes |
|------|---------|
| `lib/admin.ts` | Fail-closed when env var unset |
| `lib/event-form-validation.ts` | Image validation, parseJsonArray hardening, Cloudinary delete helper, upload accepts Buffer |
| `lib/email.ts` | HTML entity escaping |
| `lib/rateLimiter.ts` | Trust model documentation |
| `lib/actions/event.actions.ts` | Regex escaping, Cloudinary delete in deleteEvent |
| `lib/actions/booking.actions.ts` | Remove slug parameter |
| `app/api/events/route.ts` | Use validateImageFile |
| `app/api/events/[slug]/route.ts` | Rate-limit GET, use validateImageFile, Cloudinary delete on PATCH |
| `app/database/event.model.ts` | Slug on create only, collision handling, empty slug fallback |
| `app/database/booking.model.ts` | Remove slug field |
| `components/BookEvent.tsx` | button-submit → submit, remove captureException |
| `next.config.ts` | Security headers |
| `.env.example` | Add CLERK_ADMIN_USER_ID |
