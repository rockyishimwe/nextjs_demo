"use server";
import Booking from "@/app/database/booking.model";
import Event from "@/app/database/event.model";
import connectDB from "../mongodb";
import { rateLimit } from "../rateLimiter";
import { sendBookingConfirmation } from "../email";

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

    // Prevent the same email from booking an event twice
    const existing = await Booking.findOne({ eventId, email: email.trim().toLowerCase() });
    if (existing) {
      return { success: false, message: "You've already booked this event." };
    }

    // Enforce capacity when the event has one
    const event = await Event.findById(eventId);
    if (!event) {
      return { success: false, message: "Event not found." };
    }

    if (event.capacity) {
      const count = await Booking.countDocuments({ eventId });
      if (count >= event.capacity) {
        return { success: false, message: "This event is fully booked." };
      }
    }

    await Booking.create({ eventId, slug, email: email.trim().toLowerCase() });

    // Send confirmation email asynchronously
    sendBookingConfirmation({
      email: email.trim().toLowerCase(),
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
