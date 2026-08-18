import { v2 as cloudinary } from "cloudinary";

// ─── Cloudinary config validation ────────────────────────────────────────────

export function validateCloudinaryConfig(): void {
  // CLOUDINARY_URL is the standard single-variable config; cloudinary v2
  // reads it automatically, so it counts as configured.
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.trim() !== "") {
    return;
  }

  const required = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

  const missing = required.filter((key) => !process.env[key] || process.env[key]!.trim() === "");

  if (missing.length > 0) {
    throw new Error(
      `Cloudinary is not configured. Missing environment variables: ${missing.join(", ")}`,
    );
  }
}

// ─── Validation error class ───────────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// ─── Form-data validation helpers ────────────────────────────────────────────

export interface ValidatedFields {
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

function parseJsonArray(formData: FormData, fieldName: string): string[] {
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

export function validateEventFormData(formData: FormData): ValidatedFields {
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
    throw new ValidationError(`"mode" must be one of: ${validModes.join(", ")}`);
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

/**
 * Parses the optional capacity field. Returns undefined when absent/empty,
 * throws a ValidationError for non-positive values.
 */
export function parseCapacity(formData: FormData): number | undefined {
  const raw = formData.get("capacity");
  if (!raw || String(raw).trim() === "") return undefined;

  const capacity = parseInt(String(raw), 10);
  if (Number.isNaN(capacity) || capacity < 1) {
    throw new ValidationError('"capacity" must be a positive number');
  }
  return capacity;
}

// ─── Image upload ─────────────────────────────────────────────────────────────

export async function uploadEventImageToCloudinary(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ resource_type: "image", folder: "DevEvent" }, (error, results) => {
        if (error) return reject(error);
        resolve(results as { secure_url: string });
      })
      .end(buffer);
  });

  return uploadResult.secure_url;
}
