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
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventVenue?: string;
};

const BookEvent = ({
  eventId,
  slug,
  capacity,
  bookingsCount,
  eventTitle,
  eventDate,
  eventTime,
  eventVenue,
}: BookEventProps) => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFullyBooked = typeof capacity === "number" && bookingsCount >= capacity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      const result = await createBooking({ eventId, slug, email });

      if (result.success) {
        setSubmitted(true);
        toast.success("Successfully registered for the event!");
        posthog.capture("event_booked", { eventId, slug });
      } else {
        toast.error(result.message || "Booking creation failed");
        posthog.captureException("Booking creation failed");
        setStep("form");
      }
    } finally {
      setIsSubmitting(false);
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

  if (step === "confirm") {
    return (
      <div id="book-event" className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
          <p className="text-sm font-medium text-white">Confirm your booking</p>
          {eventTitle && <p className="text-xs text-light-100">{eventTitle}</p>}
          {(eventDate || eventTime) && (
            <p className="text-xs text-light-100">
              {[eventDate, eventTime].filter(Boolean).join(" at ")}
            </p>
          )}
          {eventVenue && <p className="text-xs text-light-100">{eventVenue}</p>}
          <p className="text-xs text-light-100">
            Booking as: <strong>{email}</strong>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep("form")}
            className="flex-1 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="button-submit flex-1"
          >
            {isSubmitting ? "Booking..." : "Confirm"}
          </button>
        </div>
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
          Review Booking
        </button>
      </form>
    </div>
  );
};

export default BookEvent;
