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

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_POST = 10;
const RATE_LIMIT_MAX_GET = 30;

// ─── POST /api/events ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return apiError("Unauthorized", 401);
  }

  const ip = getClientIp(req);
  const rateCheck = rateLimit(`post:${ip}`, RATE_LIMIT_MAX_POST, RATE_LIMIT_WINDOW_MS);
  if (!rateCheck.allowed) {
    return apiError("Too many requests. Please try again later.", 429);
  }

  try {
    validateCloudinaryConfig();
    await connectDB();

    const formData = await req.formData();
    const fields = validateEventFormData(formData);
    const capacity = parseCapacity(formData);

    const file = formData.get("image") as File | null;
    if (!file) {
      return apiError("Image file is required", 400);
    }

    const secureUrl = await uploadEventImageToCloudinary(file);

    const createdEvent = await Event.create({
      title: fields.title,
      description: fields.description,
      overview: fields.overview,
      image: secureUrl,
      venue: fields.venue,
      location: fields.location,
      date: fields.date,
      time: fields.time,
      mode: fields.mode,
      audience: fields.audience,
      organizer: fields.organizer,
      tags: fields.tags,
      agenda: fields.agenda,
      capacity,
    });

    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath("/admin");

    return apiOk({ message: "Event created successfully", event: createdEvent }, 201);
  } catch (e) {
    if (e instanceof ValidationError) {
      return apiError(e.message, 400);
    }
    if (e instanceof Error && e.message.startsWith("Cloudinary")) {
      return apiError(e.message, 400);
    }
    return apiError("Event creation failed. Please try again later.", 500, e);
  }
}

// ─── GET /api/events ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rateCheck = rateLimit(`get:${ip}`, RATE_LIMIT_MAX_GET, RATE_LIMIT_WINDOW_MS);
  if (!rateCheck.allowed) {
    return apiError("Too many requests. Please try again later.", 429);
  }

  try {
    await connectDB();
    const events = await Event.find().sort({ createdAt: -1 });
    return apiOk({ message: "Events fetched successfully", events }, 200, {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    });
  } catch (e) {
    return apiError("Event fetching failed. Please try again later.", 500, e);
  }
}
