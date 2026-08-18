"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { createBooking } from "@/lib/actions/booking.actions";
import posthog from "posthog-js";
import { toast } from "sonner";

type BookEventProps = {
  eventId: string;
  slug: string;
  capacity?: number;
  bookingsCount: number;
};

const BookEvent = ({ eventId, slug, capacity, bookingsCount }: BookEventProps) => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isFullyBooked = typeof capacity === "number" && bookingsCount >= capacity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await createBooking({ eventId, slug, email });

    if (result.success) {
      setSubmitted(true);
      toast.success("Successfully registered for the event!");
      posthog.capture("event_booked", { eventId, slug });
    } else {
      toast.error(result.message || "Booking creation failed");
      posthog.captureException("Booking creation failed");
    }
  };

  if (isFullyBooked && !submitted) {
    return (
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-red-400">This event is fully booked.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mt-4 text-center space-y-3">
        <p className="text-sm font-medium text-green-400">Thank you for signing up!</p>
        <p className="text-xs text-light-100">
          A confirmation email has been sent to <strong>{email}</strong>.
        </p>
        <Link href={`/events/${slug}` as Route} className="text-xs underline text-primary">
          View event details
        </Link>
      </div>
    );
  }

  return (
    <div id="book-event">
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="email"
            placeholder="Enter your email address"
            required
          />
        </div>

        <button type="submit" className="button-submit">
          Submit
        </button>
      </form>
    </div>
  );
};

export default BookEvent;
