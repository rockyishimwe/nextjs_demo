import { MetadataRoute } from "next";
import { Event } from "@/app/database";
import connectDB from "@/lib/mongodb";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://devevent.app";

  let eventEntries: MetadataRoute.Sitemap = [];

  try {
    await connectDB();
    const events = await Event.find().select("slug updatedAt createdAt").lean();

    eventEntries = events.map((event: { slug: string; updatedAt?: Date; createdAt?: Date }) => ({
      url: `${baseUrl}/events/${event.slug}`,
      lastModified: event.updatedAt ? new Date(event.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Failed to generate sitemap events:", error);
  }

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  return [...staticEntries, ...eventEntries];
}
