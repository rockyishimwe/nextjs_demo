import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin";
import connectDB from "@/lib/mongodb";
import Event from "@/app/database/event.model";
import Booking from "@/app/database/booking.model";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bookings | DevEvent",
};

const BookingsPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in" as Route);
  if (!(await isAdmin())) redirect("/" as Route);

  const { slug } = await params;

  let event: { title: string } | null = null;
  let bookings: { _id: unknown; email: string; createdAt: Date }[] = [];

  try {
    await connectDB();
    const doc = await Event.findOne({ slug }).lean();
    if (doc) {
      event = { title: doc.title };
      bookings = (await Booking.find({ eventId: doc._id })
        .sort({ createdAt: -1 })
        .lean()) as typeof bookings;
    }
  } catch (error) {
    console.error("Failed to load bookings:", error);
  }

  if (!event) return notFound();

  return (
    <section id="admin">
      <div className="header">
        <h1>Bookings</h1>
        <Link href={"/admin" as Route} className="add-new">
          Back to Events
        </Link>
      </div>

      <p className="text-light-100 text-lg">{event.title}</p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Booked at</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={2} className="empty">
                  No bookings yet.
                </td>
              </tr>
            )}

            {bookings.map((booking) => (
              <tr key={String(booking._id)}>
                <td>{booking.email}</td>
                <td>{new Date(booking.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default BookingsPage;
