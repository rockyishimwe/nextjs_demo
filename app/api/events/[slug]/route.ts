import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

import connectDB from "@/lib/mongodb";
import Event from "@/app/database/event.model";
import { rateLimit, getClientIp } from "@/lib/rateLimiter";
import {
  ValidationError,
  parseCapacity,
  validateCloudinaryConfig,
  validateEventFormData,
  uploadEventImageToCloudinary,
} from "@/lib/event-form-validation";

// Define route params type for type safety
type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

/**
 * GET /api/events/[slug]
 * Fetches a single events by its slug
 */
export async function GET(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    // Connect to database
    await connectDB();

    // Await and extract slug from params
    const { slug } = await params;

    // Validate slug parameter
    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return NextResponse.json({ message: "Invalid or missing slug parameter" }, { status: 400 });
    }

    // Sanitize slug (remove any potential malicious input)
    const sanitizedSlug = slug.trim().toLowerCase();

    // Query events by slug
    const event = await Event.findOne({ slug: sanitizedSlug }).lean();

    // Handle events not found
    if (!event) {
      return NextResponse.json(
        { message: `Event with slug '${sanitizedSlug}' not found` },
        { status: 404 },
      );
    }

    // Return successful response with events data
    return NextResponse.json({ message: "Event fetched successfully", event }, { status: 200 });
  } catch (error) {
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching events by slug:", error);
    }

    // Handle specific error types
    if (error instanceof Error) {
      // Handle database connection errors
      if (error.message.includes("MONGODB_URI")) {
        return NextResponse.json({ message: "Database configuration error" }, { status: 500 });
      }

      return NextResponse.json(
        { message: "Failed to fetch events. Please try again later." },
        { status: 500 },
      );
    }

    // Handle unknown errors
    return NextResponse.json({ message: "An unexpected error occurred" }, { status: 500 });
  }
}

// ─── PATCH /api/events/[slug] ────────────────────────────────────────────────
// Updates an event from a multipart form. The image is optional: when no new
// file is uploaded, the existing image URL is kept.

export async function PATCH(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  // Admin only
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const ip = getClientIp(req);
  const rateCheck = rateLimit(`patch:${ip}`, 10, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        message: "Too many requests. Please try again later.",
        retryAfterSeconds: rateCheck.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateCheck.resetInSeconds),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  try {
    validateCloudinaryConfig();

    await connectDB();

    const { slug } = await params;
    const sanitizedSlug = slug.trim().toLowerCase();

    const existing = await Event.findOne({ slug: sanitizedSlug });
    if (!existing) {
      return NextResponse.json(
        { message: `Event with slug '${sanitizedSlug}' not found` },
        { status: 404 },
      );
    }

    const formData = await req.formData();
    const fields = validateEventFormData(formData);
    const capacity = parseCapacity(formData);

    // Keep the existing image unless a new file was uploaded
    let image = existing.image;
    const file = formData.get("image") as File | null;
    if (file && file.size > 0) {
      image = await uploadEventImageToCloudinary(file);
    }

    existing.title = fields.title;
    existing.description = fields.description;
    existing.overview = fields.overview;
    existing.image = image;
    existing.venue = fields.venue;
    existing.location = fields.location;
    existing.date = fields.date;
    existing.time = fields.time;
    existing.mode = fields.mode;
    existing.audience = fields.audience;
    existing.organizer = fields.organizer;
    existing.tags = fields.tags;
    existing.agenda = fields.agenda;
    existing.capacity = capacity;

    // The pre-save hook regenerates the slug if the title changed
    await existing.save();

    return NextResponse.json(
      { message: "Event updated successfully", event: existing },
      { status: 200 },
    );
  } catch (e) {
    console.error("Event update failed:", e);

    if (e instanceof ValidationError) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }

    if (e instanceof Error && e.message.startsWith("Cloudinary")) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Event update failed. Please try again later." },
      { status: 500 },
    );
  }
}
