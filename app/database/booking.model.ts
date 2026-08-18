import { Schema, model, models, Document, Types } from "mongoose";
import Event from "./event.model";

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  slug: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email: string) {
          // RFC 5322 compliant email validation regex
          const emailRegex =
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
          return emailRegex.test(email);
        },
        message: "Please provide a valid email address",
      },
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  },
);
// Pre-save hook to validate event exists before creating booking
BookingSchema.pre("save", async function () {
  const booking = this as IBooking;

  // Only validate eventId if it's new or modified
  if (booking.isModified("eventId") || booking.isNew) {
    const eventExists = await Event.findById(booking.eventId).select("_id");

    if (!eventExists) {
      throw new Error(`Event with ID ${booking.eventId} does not exist`);
    }
  }
});
// Prevent duplicate bookings for the same event + email
BookingSchema.index({ eventId: 1, email: 1 }, { unique: true });
// Compound index for common queries (event bookings by date)
BookingSchema.index({ eventId: 1, createdAt: -1 });
// Index on email for user booking lookups
BookingSchema.index({ email: 1 });

const Booking = models.Booking || model<IBooking>("Booking", BookingSchema);

export default Booking;
