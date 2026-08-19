import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import { Event, type IEvent } from "@/app/database";
import connectDB from "@/lib/mongodb";
import { unstable_cache } from "next/cache";

const getHomeEvents = unstable_cache(
  async () => {
    try {
      await connectDB();
      return (await Event.find().sort({ createdAt: -1 }).limit(12)).map((event) => event.toObject());
    } catch (error) {
      console.error("Failed to fetch events:", error);
      return [];
    }
  },
  ["home-events"],
  { revalidate: 60, tags: ["events"] },
);

export const dynamic = "force-dynamic";

const Page = async () => {
  const events: IEvent[] = await getHomeEvents();

  return (
    <section>
      <h1 className="text-center">
        The Hub for Every Dev <br /> Event You Can&apos;t Miss
      </h1>
      <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

      <ExploreBtn />

      <div id="events" className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className="events">
          {events.length > 0 &&
            events.map((event: IEvent) => (
              <li key={event.title} className="list-none">
                <EventCard {...event} />
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
};

export default Page;
