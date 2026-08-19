import Link from "next/link";
import Image from "next/image";
import type { IEvent } from "@/app/database";
import AdminDeleteButton from "./AdminDeleteButton";
import { formatDate, formatTime } from "@/lib/format";

type EventManagementTableProps = {
  events: IEvent[];
  page: number;
  totalPages: number;
  /** Path used for the pagination links (e.g. "/admin"). */
  paginationPath: string;
  /** Current search query, if any. */
  search?: string;
};

const EventManagementTable = ({
  events,
  page,
  totalPages,
  paginationPath,
  search = "",
}: EventManagementTableProps) => {
  return (
    <section id="admin">
      <div className="header">
        <h1>Event Management</h1>
        <Link href="/admin/create-event" className="add-new">
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
                  <div className="flex flex-col items-center gap-3 py-8">
                    <svg className="h-16 w-16 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <p className="text-base font-medium text-white/60">
                      {search ? "No events match your search." : "No events yet"}
                    </p>
                    {!search && (
                      <Link href="/admin/create-event" className="add-new">
                        Create your first event
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {events.map((event) => {
              const booked = event.bookedCount ?? 0;
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
                      <Link href={`/admin/bookings/${event.slug}`} className="action-view">
                        View
                      </Link>
                      <Link href={`/admin/edit/${event.slug}`} className="action-edit">
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
              }`
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
              }`
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
