#!/usr/bin/env node
/**
 * Seeds the demo events (which use the images in /public/images) into MongoDB
 * so they show up on the home page.
 *
 * Usage: npm run seed   (or: node scripts/seed-demo-events.mjs)
 *
 * - Reads MONGODB_URI from .env.local
 * - Defines the same Event schema + pre-save hooks as app/database/event.model.ts
 *   so slugs, dates and times are normalized identically to the app.
 * - Idempotent: existing events are matched by slug and updated, never duplicated.
 */
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Load MONGODB_URI from .env.local ───────────────────────────────────────
function loadEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

const env = loadEnvFile(path.join(__dirname, "..", ".env.local"));
const MONGODB_URI = env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

// ─── Event schema (mirrors app/database/event.model.ts) ─────────────────────
const { Schema, model, models } = mongoose;

const EventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    overview: { type: String, required: true, trim: true, maxlength: 500 },
    image: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    mode: {
      type: String,
      required: true,
      enum: { values: ["online", "offline", "hybrid"] },
    },
    audience: { type: String, required: true, trim: true },
    agenda: {
      type: [String],
      required: true,
      validate: { validator: (v) => v.length > 0 },
    },
    organizer: { type: String, required: true, trim: true },
    tags: {
      type: [String],
      required: true,
      validate: { validator: (v) => v.length > 0 },
    },
  },
  { timestamps: true }
);

EventSchema.pre("save", function () {
  if (this.isModified("title") || this.isNew) {
    this.slug = generateSlug(this.title);
  }
  if (this.isModified("date")) {
    this.date = normalizeDate(this.date);
  }
  if (this.isModified("time")) {
    this.time = normalizeTime(this.time);
  }
});

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) throw new Error("Invalid date format");
  return date.toISOString().split("T")[0];
}

function normalizeTime(timeString) {
  const timeRegex = /^(\d{1,2}):(\d{2})(\s*(AM|PM))?$/i;
  const match = timeString.trim().match(timeRegex);
  if (!match) throw new Error("Invalid time format. Use HH:MM or HH:MM AM/PM");
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[4]?.toUpperCase();
  if (period) {
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
  }
  if (
    hours < 0 ||
    hours > 23 ||
    parseInt(minutes) < 0 ||
    parseInt(minutes) > 59
  ) {
    throw new Error("Invalid time values");
  }
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

const Event = models.Event || model("Event", EventSchema);

// ─── Demo events (images live in /public/images) ────────────────────────────
const demoEvents = [
  {
    image: "/images/event1.png",
    title: "RCA SUMMIT RWANDA 2026",
    location: "Kigali, Rwanda",
    date: "2026-05-15",
    time: "09:00 AM",
    venue: "Kigali Convention Centre",
    mode: "offline",
    description:
      "The RCA Summit brings together Rwanda's tech community for a full day of keynotes, workshops and networking around building Africa's digital future.",
    overview:
      "A community-driven summit connecting developers, students and startups across Rwanda and beyond.",
    audience: "Developers & tech enthusiasts",
    organizer: "Rwanda Coding Academy",
    agenda: [
      "Registration & welcome",
      "Keynote: Building Africa's digital future",
      "Community showcase & networking",
    ],
    tags: ["rca", "summit", "rwanda"],
  },
  {
    image: "/images/event2.png",
    title: "KubeCon + CloudNativeCon Europe 2026",
    location: "Vienna, Austria",
    date: "2026-03-18",
    time: "10:00 AM",
    venue: "Messe Wien Exhibition Center",
    mode: "offline",
    description:
      "The largest gathering of cloud native enthusiasts in Europe. Four days of keynotes, maintainer summits, lightning talks and the Cloud Native ecosystem expo.",
    overview:
      "Join the cloud native community for the definitive event on Kubernetes and open source infrastructure.",
    audience: "Platform engineers & DevOps teams",
    organizer: "CNCF",
    agenda: [
      "Opening keynote",
      "Kubernetes deep dives",
      "Cloud Native ecosystem expo",
    ],
    tags: ["kubernetes", "cloud-native", "cncf"],
  },
  {
    image: "/images/event3.png",
    title: "AWS re:Invent 2025",
    location: "Las Vegas, NV, USA",
    date: "2025-12-01",
    time: "08:30 AM",
    venue: "The Venetian Expo",
    mode: "offline",
    description:
      "Amazon's flagship cloud conference with hundreds of breakout sessions, hands-on labs, keynotes and the latest announcements across AWS services.",
    overview:
      "Five days of cloud innovation, training and certifications for AWS builders and architects.",
    audience: "Cloud architects & developers",
    organizer: "Amazon Web Services",
    agenda: [
      "Keynote: AWS CEO",
      "Breakout sessions",
      "Hands-on labs",
    ],
    tags: ["aws", "cloud", "conference"],
  },
  {
    image: "/images/event4.png",
    title: "Next.js Conf 2025",
    location: "Los Angeles, CA, USA (Hybrid)",
    date: "2025-11-12",
    time: "09:30 AM",
    venue: "Los Angeles Convention Center",
    mode: "hybrid",
    description:
      "The official Next.js conference, streamed worldwide. Learn about the future of the React framework from the Vercel team and the community.",
    overview:
      "A hybrid event for React and web developers covering the latest in Next.js and the modern web.",
    audience: "React & frontend developers",
    organizer: "Vercel",
    agenda: [
      "Opening keynote",
      "Framework talks",
      "Workshops",
    ],
    tags: ["nextjs", "react", "web"],
  },
  {
    image: "/images/event5.png",
    title: "Google Cloud Next 2026",
    location: "San Jose, CA, USA",
    date: "2026-04-07",
    time: "09:00 AM",
    venue: "San Jose McEnery Convention Center",
    mode: "offline",
    description:
      "Google Cloud's annual user conference, featuring product announcements, deep technical sessions and customer stories across AI, data and infrastructure.",
    overview:
      "Where the Google Cloud ecosystem meets to explore AI, data and cloud infrastructure.",
    audience: "Cloud engineers & data teams",
    organizer: "Google Cloud",
    agenda: [
      "Keynote: Google Cloud",
      "AI & ML sessions",
      "Partner showcase",
    ],
    tags: ["google-cloud", "ai", "infrastructure"],
  },
  {
    image: "/images/event6.png",
    title: "ETHGlobal Hackathon: Paris 2026",
    location: "Paris, France",
    date: "2026-07-10",
    time: "10:00 AM",
    venue: "Station F",
    mode: "offline",
    description:
      "A weekend-long hackathon for web3 builders. Ship a project, meet the ecosystem and compete for prizes in front of a global audience.",
    overview:
      "36 hours of building, mentoring and demoing at the world's largest startup campus.",
    audience: "Web3 & blockchain developers",
    organizer: "ETHGlobal",
    agenda: [
      "Project submissions open",
      "Hacking begins",
      "Demo day & winners",
    ],
    tags: ["web3", "hackathon", "ethereum"],
  },
  {
    image: "/images/event6.png",
    title: "Open Source Summit North America 2026",
    location: "Vancouver, Canada",
    date: "2026-06-22",
    time: "09:00 AM",
    venue: "Vancouver Convention Centre",
    mode: "offline",
    description:
      "The premier event for open source developers, technologists and community leaders to collaborate, learn and share information across the open source ecosystem.",
    overview:
      "Connecting maintainers, contributors and companies advancing open source software.",
    audience: "Open source maintainers & contributors",
    organizer: "The Linux Foundation",
    agenda: [
      "Maintainers track",
      "Community keynotes",
      "Project booths",
    ],
    tags: ["open-source", "linux", "community"],
  },
];

// ─── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  let created = 0;
  let updated = 0;

  for (const data of demoEvents) {
    const slug = generateSlug(data.title);
    const existing = await Event.findOne({ slug });

    if (existing) {
      Object.assign(existing, data);
      await existing.save();
      updated++;
      console.log(`Updated:  ${data.title}`);
    } else {
      await Event.create(data);
      created++;
      console.log(`Created:  ${data.title}`);
    }
  }

  const total = await Event.countDocuments();
  console.log(
    `\nDone. ${created} created, ${updated} updated. Total events in DB: ${total}`
  );

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
