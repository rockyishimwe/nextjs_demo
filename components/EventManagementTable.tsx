import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import type { IEvent } from "@/app/database";
import AdminDeleteButton from "./AdminDeleteButton";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// "2026-09-15" -> "15th September 2026"
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;

  const suffix =
    d % 10 === 1 && d !== 11
      ? "st"
      : d % 10 === 2 && d !== 12
        ? "nd"
        : d % 10 === 3 && d !== 13
          ? "rd"
          : "th";

  return `${d}${suffix} ${MONTHS[m - 1]} ${y}`;
}

// "14:25" -> "2:25pm"
function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;

  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")}${period}`;
}

type EventManagementTableProps = {
  events: IEvent[];
  bookingMap: Map<string, number>;
  page: number;
  totalPages: number;
  /** Path used for the pagination links (e.g. "/admin" or "/events"). */
  paginationPath: string;
  /** Current search query, if any. */
  search?: string;
};

const EventManagementTable = ({
  events,
  bookingMap,
  page,
  totalPages,
  paginationPath,
  search = "",
}: EventManagementTableProps) => {
  return (
    <section id="admin">
      <div className="header">
        <h1>Event Management</h1>
        <Link href={"/admin/create-event" as Route} className="add-new">
          Add New Event
        </Link>
      </div>

      <form action={paginationPath} className="search-form" method="GET">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search by name, location, venue or type…"
        />
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Events</th>
              <th>Location</th>
              <th>Date</th>
              <th>Time</th>
              <th>Booked spot</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  {search
                    ? "No events match your search."
                    : "No events yet. Click “Add New Event” to create one."}
                </td>
              </tr>
            )}

            {events.map((event) => {
              const booked = bookingMap.get(String(event._id)) ?? 0;
              const capacity = event.capacity;
              const isFull = typeof capacity === "number" && booked >= capacity;

              return (
                <tr key={event.slug}>
                  <td>
                    <div className="event-cell">
                      <div className="thumb">
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <span>{event.title}</span>
                    </div>
                  </td>
                  <td>{event.location}</td>
                  <td>{formatDate(event.date)}</td>
                  <td>{formatTime(event.time)}</td>
                  <td>
                    {isFull ? (
                      <span className="booked-full">Fully booked</span>
                    ) : (
                      <span>
                        {booked}
                        {typeof capacity === "number" ? ` / ${capacity}` : ""}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <Link href={`/admin/bookings/${event.slug}` as Route} className="action-view">
                        View
                      </Link>
                      <Link href={`/admin/edit/${event.slug}` as Route} className="action-edit">
                        Edit
                      </Link>
                      <AdminDeleteButton slug={event.slug} title={event.title} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        {page > 1 ? (
          <Link
            href={
              `${paginationPath}?page=${page - 1}${
                search ? `&q=${encodeURIComponent(search)}` : ""
              }` as Route
            }
            className="page-btn"
          >
            Previous
          </Link>
        ) : (
          <span className="page-btn disabled">Previous</span>
        )}

        <span className="page-indicator">
          Page {page} of {totalPages}
        </span>

        {page < totalPages ? (
          <Link
            href={
              `${paginationPath}?page=${page + 1}${
                search ? `&q=${encodeURIComponent(search)}` : ""
              }` as Route
            }
            className="page-btn"
          >
            Next
          </Link>
        ) : (
          <span className="page-btn disabled">Next</span>
        )}
      </div>
    </section>
  );
};

export default EventManagementTable;
