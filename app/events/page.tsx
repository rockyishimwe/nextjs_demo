import type { Metadata } from "next";
import { getAdminEvents } from "@/lib/actions/event.actions";
import EventManagementTable from "@/components/EventManagementTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events | DevEvent",
};

const PAGE_SIZE = 10;

const EventsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) => {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { events, total, bookingMap } = await getAdminEvents(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <EventManagementTable
      events={events}
      bookingMap={bookingMap}
      page={page}
      totalPages={totalPages}
      paginationPath="/events"
    />
  );
};

export default EventsPage;
