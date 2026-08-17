import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Event } from "@/app/database";
import { v2 as cloudinary } from "cloudinary";
import { rateLimit, getClientIp } from "@/lib/rateLimiter";

// ─── Rate limiting config ────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_POST = 10; // 10 POST requests per minute
const RATE_LIMIT_MAX_GET = 30; // 30 GET requests per minute

// ─── Cloudinary config validation ────────────────────────────────────────────
function validateCloudinaryConfig(): void {
  // CLOUDINARY_URL is the standard single-variable config; cloudinary v2
  // reads it automatically, so it counts as configured.
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.trim() !== "") {
    return;
  }

  const required = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  const missing = required.filter(
    (key) => !process.env[key] || process.env[key]!.trim() === "",
  );

  if (missing.length > 0) {
    throw new Error(
      `Cloudinary is not configured. Missing environment variables: ${missing.join(", ")}`,
    );
  }
}

// ─── Validation error class ───────────────────────────────────────────────────

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// ─── Form-data validation helpers ────────────────────────────────────────────

interface ValidatedFields {
  title: string;
  description: string;
  overview: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  organizer: string;
  tags: string[];
  agenda: string[];
}

function parseJsonArray(
  formData: FormData,
  fieldName: string,
): string[] {
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

  return parsed as string[];
}

function validateEventFormData(formData: FormData): ValidatedFields {
  const requiredTextFields = [
    "title",
    "description",
    "overview",
    "venue",
    "location",
    "date",
    "time",
    "mode",
    "audience",
    "organizer",
  ] as const;

  const fields: Record<string, string> = {};

  for (const field of requiredTextFields) {
    const value = formData.get(field);
    if (!value || (typeof value === "string" && value.trim() === "")) {
      throw new ValidationError(`"${field}" is required`);
    }
    fields[field] = (value as string).trim();
  }

  // Validate mode enum
  const validModes = ["online", "offline", "hybrid"];
  if (!validModes.includes(fields.mode.toLowerCase())) {
    throw new ValidationError(
      `"mode" must be one of: ${validModes.join(", ")}`,
    );
  }

  // Parse JSON array fields
  const tags = parseJsonArray(formData, "tags");
  const agenda = parseJsonArray(formData, "agenda");

  return {
    ...fields,
    mode: fields.mode.toLowerCase(),
    tags,
    agenda,
  } as ValidatedFields;
}

// ─── POST /api/events ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Rate limit check
  const ip = getClientIp(req);
  const rateCheck = rateLimit(`post:${ip}`, RATE_LIMIT_MAX_POST, RATE_LIMIT_WINDOW_MS);
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
    // Validate Cloudinary config early
    validateCloudinaryConfig();

    await connectDB();

    const formData = await req.formData();

    // Validate all form fields
    const fields = validateEventFormData(formData);

    // Validate and process image
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 },
      );
    }

    // Upload image to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "DevEvent" },
          (error, results) => {
            if (error) return reject(error);
            resolve(results as { secure_url: string });
          },
        )
        .end(buffer);
    });

    // Create event in database
    // Slug is auto-generated by the Event model's pre-save hook
    const createdEvent = await Event.create({
      title: fields.title,
      description: fields.description,
      overview: fields.overview,
      image: uploadResult.secure_url,
      venue: fields.venue,
      location: fields.location,
      date: fields.date,
      time: fields.time,
      mode: fields.mode,
      audience: fields.audience,
      organizer: fields.organizer,
      tags: fields.tags,
      agenda: fields.agenda,
    });

    return NextResponse.json(
      { message: "Event created successfully", event: createdEvent },
      { status: 201 },
    );
  } catch (e) {
    console.error("Event creation failed:", e);

    // Return 400 for known validation errors
    if (e instanceof ValidationError) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }

    if (e instanceof Error && e.message.startsWith("Cloudinary")) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: "Event creation failed",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 },
    );
  }
}

// ─── GET /api/events ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Rate limit check
  const ip = getClientIp(req);
  const rateCheck = rateLimit(`get:${ip}`, RATE_LIMIT_MAX_GET, RATE_LIMIT_WINDOW_MS);
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
    await connectDB();
    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Events fetched successfully", events },
      { status: 200 },
    );
  } catch (e) {
    console.error("Event fetching failed:", e);
    return NextResponse.json(
      {
        message: "Event fetching failed",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 },
    );
  }
}
