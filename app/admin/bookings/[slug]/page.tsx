import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Event, Booking } from "@/app/database";
import connectDB from "@/lib/mongodb";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Bookings — ${slug} | DevEvent` };
}

const BookingsPage = async ({ params }: Props) => {
  const { slug } = await params;

  await connectDB();

  const event = await Event.findOne({ slug }).lean();
  if (!event) return notFound();

  const bookings = await Booking.find({ eventId: event._id })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <section id="admin" className="space-y-6">
      <div className="header">
        <h1 className="text-3xl font-bold">Bookings for {event.title}</h1>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Booked At</th>
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
              <tr key={booking._id.toString()}>
                <td>{booking.email}</td>
                <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default BookingsPage;
