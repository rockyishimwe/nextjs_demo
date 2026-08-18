"use server";
import Booking from "@/app/database/booking.model";
import Event from "@/app/database/event.model";
import connectDB from "../mongodb";
import { rateLimit } from "../rateLimiter";
import { sendBookingConfirmation } from "../email";
import { revalidatePath } from "next/cache";

export const createBooking = async ({
  eventId,
  slug,
  email,
}: {
  eventId: string;
  slug: string;
  email: string;
}) => {
  try {
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return { success: false, message: "Invalid email address." };
    }

    // Rate limit check by email (max 5 requests per minute)
    const rateCheck = rateLimit(`booking:${email.trim().toLowerCase()}`, 5, 60_000);
    if (!rateCheck.allowed) {
      return { success: false, message: "Too many booking attempts. Please try again later." };
    }

    await connectDB();

    const normalizedEmail = email.trim().toLowerCase();

    // Fetch the event first to validate it exists and check capacity
    const event = await Event.findById(eventId);
    if (!event) {
      return { success: false, message: "Event not found." };
    }

    // If the event has a capacity, atomically increment bookedCount only if under capacity.
    // This is safe against race conditions — MongoDB's findOneAndUpdate is atomic.
    if (event.capacity) {
      const updated = await Event.findOneAndUpdate(
        {
          _id: eventId,
          $expr: { $lt: ["$bookedCount", "$capacity"] },
        },
        { $inc: { bookedCount: 1 } },
        { new: true },
      );

      if (!updated) {
        return { success: false, message: "This event is fully booked." };
      }
    } else {
      // No capacity limit — just increment the counter
      await Event.findByIdAndUpdate(eventId, { $inc: { bookedCount: 1 } });
    }

    // Create the booking. The unique index on {eventId, email} prevents duplicates.
    try {
      await Booking.create({ eventId, slug, email: normalizedEmail });
    } catch (err: unknown) {
      // E11000 = duplicate key error — this email already booked this event
      if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
        // Roll back the bookedCount increment
        await Event.findByIdAndUpdate(eventId, { $inc: { bookedCount: -1 } });
        return { success: false, message: "You've already booked this event." };
      }
      // Any other error — also roll back
      await Event.findByIdAndUpdate(eventId, { $inc: { bookedCount: -1 } });
      throw err;
    }

    // Invalidate cached event data so bookedCount reflects the new booking
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath(`/events/${slug}`);

    // Send confirmation email asynchronously
    sendBookingConfirmation({
      email: normalizedEmail,
      eventTitle: event.title,
      date: event.date,
      time: event.time,
      venue: event.venue,
      slug,
    }).catch((err) => console.error("Async email dispatch failed:", err));

    return { success: true };
  } catch (e) {
    console.error("create booking failed", e);
    return { success: false, message: "Booking failed. Please try again." };
  }
};
