import { NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin";
import connectDB from "@/lib/mongodb";
import { Event } from "@/app/database";
import { rateLimit, getClientIp } from "@/lib/rateLimiter";
import {
  ValidationError,
  parseCapacity,
  validateCloudinaryConfig,
  validateEventFormData,
  uploadEventImageToCloudinary,
} from "@/lib/event-form-validation";
import { apiOk, apiError } from "@/lib/api-errors";
import { revalidatePath } from "next/cache";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

// ─── GET /api/events/[slug] ─────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { slug } = await params;

    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return apiError("Invalid or missing slug parameter", 400);
    }

    const sanitizedSlug = slug.trim().toLowerCase();
    const event = await Event.findOne({ slug: sanitizedSlug }).lean();

    if (!event) {
      return apiError(`Event not found`, 404);
    }

    return apiOk({ message: "Event fetched successfully", event }, 200, {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return apiError("Database configuration error", 500);
    }
    return apiError("Failed to fetch events. Please try again later.", 500, error);
  }
}

// ─── PATCH /api/events/[slug] ───────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin())) {
    return apiError("Unauthorized", 401);
  }

  const ip = getClientIp(req);
  const rateCheck = await rateLimit(`patch:${ip}`, 10, 60_000);
  if (!rateCheck.allowed) {
    return apiError("Too many requests. Please try again later.", 429);
  }

  try {
    validateCloudinaryConfig();
    await connectDB();

    const { slug } = await params;
    const sanitizedSlug = slug.trim().toLowerCase();

    const existing = await Event.findOne({ slug: sanitizedSlug });
    if (!existing) {
      return apiError("Event not found", 404);
    }

    const formData = await req.formData();
    const fields = validateEventFormData(formData);
    const capacity = parseCapacity(formData);

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

    await existing.save();

    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath(`/events/${sanitizedSlug}`);
    revalidatePath("/admin");

    return apiOk({ message: "Event updated successfully", event: existing });
  } catch (e) {
    if (e instanceof ValidationError) {
      return apiError(e.message, 400);
    }
    if (e instanceof Error && e.message.startsWith("Cloudinary")) {
      return apiError(e.message, 400);
    }
    return apiError("Event update failed. Please try again later.", 500, e);
  }
}
