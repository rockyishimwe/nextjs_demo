# DevEvent API Documentation

Base URL: `http://localhost:3000/api` (development) or your production domain.

## Authentication

Most write endpoints require Clerk authentication. Include a valid session cookie with requests.

- **401 Unauthorized** — returned when not authenticated
- **403 Forbidden** — returned when authenticated but not authorized (admin endpoints)

---

## Endpoints

### GET /api/events

List all events.

**Auth:** Public (rate-limited)

**Query Parameters:** None

**Response (200):**
```json
{
  "message": "Events fetched successfully",
  "events": [
    {
      "_id": "...",
      "title": "...",
      "slug": "...",
      "description": "...",
      "image": "https://...",
      "location": "...",
      "date": "2026-03-15",
      "time": "10:00 AM",
      "venue": "...",
      "mode": "offline|online|hybrid",
      "capacity": 500,
      "bookedCount": 42,
      "tags": ["..."],
      "createdAt": "..."
    }
  ]
}
```

**Caching:** `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`

**Rate Limit:** 30 requests per minute per IP

---

### POST /api/events

Create a new event.

**Auth:** Required (admin only)

**Request Body:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Event title |
| description | string | Yes | Short description |
| image | File | Yes | Event banner image |
| location | string | Yes | City/country |
| date | string | Yes | YYYY-MM-DD format |
| time | string | Yes | e.g., "10:00 AM" |
| venue | string | Yes | Venue name |
| mode | string | Yes | "offline", "online", or "hybrid" |
| overview | string | No | Detailed overview |
| audience | string | No | Target audience |
| organizer | string | No | Organizer name |
| capacity | number | No | Max attendees |
| tags | string | No | Comma-separated tags |
| agenda | string | No | Newline-separated agenda items |

**Response (201):**
```json
{
  "message": "Event created successfully",
  "event": { ... }
}
```

**Error Responses:**
- `400` — Validation error (missing fields, invalid data)
- `401` — Unauthorized
- `429` — Rate limit exceeded
- `500` — Server error

**Rate Limit:** 10 requests per minute per IP

---

### GET /api/events/[slug]

Get a single event by slug.

**Auth:** Public (rate-limited)

**Path Parameters:**
- `slug` — Event slug (e.g., `rca-summit-rwanda-2026`)

**Response (200):**
```json
{
  "message": "Event fetched successfully",
  "event": { ... }
}
```

**Error Responses:**
- `400` — Invalid slug
- `404` — Event not found

**Caching:** `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`

---

### PATCH /api/events/[slug]

Update an existing event.

**Auth:** Required (admin only)

**Path Parameters:**
- `slug` — Event slug

**Request Body:** Same as POST (all fields optional except at least one must be provided)

**Response (200):**
```json
{
  "message": "Event updated successfully",
  "event": { ... }
}
```

**Error Responses:**
- `400` — Validation error
- `401` — Unauthorized
- `404` — Event not found
- `429` — Rate limit exceeded

**Rate Limit:** 10 requests per minute per IP

---

## Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "status": 400,
  "details": "Optional additional context (dev only)"
}
```

---

## Server Actions

In addition to the REST API, DevEvent uses Next.js Server Actions for UI mutations:

### createBooking
- **File:** `lib/actions/booking.actions.ts`
- **Parameters:** `{ eventId, slug, email }`
- **Returns:** `{ success: boolean, message?: string }`
- **Features:** Atomic capacity check, duplicate prevention, rate limiting

### deleteEvent
- **File:** `lib/actions/event.actions.ts`
- **Parameters:** `{ slug }`
- **Returns:** `{ success: boolean, message?: string }`
- **Auth:** Admin only

### getAdminEvents
- **File:** `lib/actions/event.actions.ts`
- **Parameters:** `{ page, pageSize, q? }`
- **Returns:** `{ events, total }`
- **Auth:** Admin only

### getPublicEvents
- **File:** `lib/actions/event.actions.ts`
- **Parameters:** `{ page, pageSize }`
- **Returns:** `{ events, total }`
- **Auth:** Public

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /api/events | 30 | 1 min |
| POST /api/events | 10 | 1 min |
| GET /api/events/[slug] | 30 | 1 min |
| PATCH /api/events/[slug] | 10 | 1 min |
| createBooking | 5 | 1 min |

**Production:** Uses Upstash Redis (requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`)

**Development:** Falls back to in-memory rate limiting

---

## Data Models

### Event
```typescript
{
  _id: ObjectId;
  title: string;
  slug: string;          // Auto-generated from title
  description: string;
  overview?: string;
  image: string;         // Cloudinary URL
  venue: string;
  location: string;
  date: string;          // YYYY-MM-DD
  time: string;          // e.g., "10:00 AM"
  mode: "offline" | "online" | "hybrid";
  audience?: string;
  organizer?: string;
  capacity?: number;
  bookedCount: number;   // Auto-managed
  tags: string[];
  agenda: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Booking
```typescript
{
  _id: ObjectId;
  eventId: ObjectId;     // References Event
  slug: string;          // Event slug (denormalized)
  email: string;         // Booker's email
  createdAt: Date;
}
// Unique compound index: { eventId, email }
```
