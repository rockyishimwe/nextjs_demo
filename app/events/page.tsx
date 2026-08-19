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
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <svg className="h-20 w-20 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="text-lg font-medium text-white/60">No events yet</p>
          <p className="text-sm text-white/40">Check back soon — new events are added regularly!</p>
        </div>
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
