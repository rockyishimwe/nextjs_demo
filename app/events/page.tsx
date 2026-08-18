import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { getPublicEvents } from "@/lib/actions/event.actions";
import EventCard from "@/components/EventCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events | DevEvent",
  description: "Browse upcoming developer events, hackathons and conferences.",
};

const PAGE_SIZE = 12;

const EventsPage = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { events, total } = await getPublicEvents(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section id="home" className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-center">All Events</h1>
      <p className="text-center mt-3 text-light-100">
        Browse upcoming developer events, hackathons and conferences
      </p>

      {events.length === 0 ? (
        <p className="text-center mt-20 text-light-100">No events yet. Check back soon!</p>
      ) : (
        <>
          <ul className="events mt-12">
            {events.map((event) => (
              <li key={event.slug} className="list-none">
                <EventCard
                  title={event.title}
                  image={event.image}
                  slug={event.slug}
                  location={event.location}
                  date={event.date}
                  time={event.time}
                />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="pagination mt-12 justify-center">
              {page > 1 ? (
                <Link href={`/events?page=${page - 1}` as Route} className="page-btn">
                  Previous
                </Link>
              ) : (
                <span className="page-btn disabled">Previous</span>
              )}

              <span className="page-indicator">
                Page {page} of {totalPages}
              </span>

              {page < totalPages ? (
                <Link href={`/events?page=${page + 1}` as Route} className="page-btn">
                  Next
                </Link>
              ) : (
                <span className="page-btn disabled">Next</span>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default EventsPage;
