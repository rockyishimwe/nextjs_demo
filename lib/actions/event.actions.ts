"use server";
import { isAdmin } from "../admin";
import { Event, Booking, type IEvent } from "@/app/database";
import connectDB from "../mongodb";
import { cacheEvents, cacheEventBySlug } from "../cache";
import { revalidatePath } from "next/cache";

export const getSimilarEventsBySlug = async (slug: string) => {
  const cached = cacheEventBySlug(async () => {
    try {
      await connectDB();
      const event = await Event.findOne({ slug });

      if (!event) return [];

      return await Event.find({
        _id: { $ne: event._id },
        tags: { $in: event.tags },
      }).lean();
    } catch {
      return [];
    }
  }, slug);

  return cached();
};

export const deleteEvent = async (slug: string) => {
  try {
    // Admin only
    if (!(await isAdmin())) {
      return { success: false, message: "Unauthorized" };
    }

    await connectDB();

    const event = await Event.findOne({ slug });
    if (!event) {
      return { success: false, message: "Event not found" };
    }

    // Remove the event's bookings first, then the event itself
    await Booking.deleteMany({ eventId: event._id });
    await Event.deleteOne({ _id: event._id });

    // Invalidate cached public data
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath(`/events/${slug}`);

    return { success: true };
  } catch (e) {
    console.error("delete event failed", e);
    return { success: false, message: "Failed to delete event" };
  }
};

export const getPublicEvents = async (page: number, pageSize: number) => {
  const cached = cacheEvents(async () => {
    try {
      await connectDB();
      const skip = (page - 1) * pageSize;
      const [events, total] = await Promise.all([
        Event.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .lean() as unknown as Promise<IEvent[]>,
        Event.countDocuments(),
      ]);
      return { events, total };
    } catch (e) {
      console.error("Failed to load public events:", e);
      return { events: [] as IEvent[], total: 0 };
    }
  });

  return cached();
};

export const getAdminEvents = async (page: number, pageSize: number, q = "") => {
  try {
    if (!(await isAdmin())) {
      return {
        events: [] as IEvent[],
        total: 0,
        bookingMap: new Map<string, number>(),
      };
    }

    await connectDB();

    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {};
    const query = q.trim();
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { venue: { $regex: query, $options: "i" } },
        { mode: { $regex: query, $options: "i" } },
      ];
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean() as unknown as Promise<IEvent[]>,
      Event.countDocuments(filter),
    ]);

    return { events, total };
  } catch (e) {
    console.error("Failed to load events:", e);
    return { events: [] as IEvent[], total: 0 };
  }
};
