import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin";
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
  searchParams: Promise<{ page?: string; q?: string }>;
}) => {
  // Admin only — this is the management view. Event detail pages stay public.
  const { userId } = await auth();
  if (!userId) redirect("/sign-in" as Route);
  if (!(await isAdmin())) redirect("/" as Route);

  const { page: pageParam, q: qParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const q = (qParam ?? "").trim();

  const { events, total, bookingMap } = await getAdminEvents(page, PAGE_SIZE, q);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <EventManagementTable
      events={events}
      bookingMap={bookingMap}
      page={page}
      totalPages={totalPages}
      paginationPath="/events"
      search={q}
    />
  );
};

export default EventsPage;
