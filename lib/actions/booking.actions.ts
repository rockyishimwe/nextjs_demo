"use server";
import Booking from "@/app/database/booking.model";
import Event from "@/app/database/event.model";
import connectDB from "../mongodb";

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
    await connectDB();

    // Prevent the same email from booking an event twice
    const existing = await Booking.findOne({ eventId, email });
    if (existing) {
      return { success: false, message: "You've already booked this event." };
    }

    // Enforce capacity when the event has one
    const event = await Event.findById(eventId);
    if (event?.capacity) {
      const count = await Booking.countDocuments({ eventId });
      if (count >= event.capacity) {
        return { success: false, message: "This event is fully booked." };
      }
    }

    await Booking.create({ eventId, slug, email });

    return { success: true };
  } catch (e) {
    console.error("create booking failed", e);
    return { success: false, message: "Booking failed. Please try again." };
  }
};
