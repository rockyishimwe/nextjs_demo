import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import Event, { IEvent } from "@/app/database/event.model";
import connectDB from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const Page = async () => {
    let events: IEvent[] = [];

    try {
        await connectDB();
        // Convert Mongoose documents to plain objects: spreading a document
        // directly ({...event}) does not include its schema fields.
        events = (await Event.find().sort({ createdAt: -1 })).map((event) => event.toObject());
    } catch (error) {
        console.error("Failed to fetch events:", error);
    }

    return (
        <section>
            <h1 className="text-center">The Hub for Every Dev <br /> Event You Can&apos;t Miss</h1>
            <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

            <ExploreBtn />

            <div id="events" className="mt-20 space-y-7">
                <h3>Featured Events</h3>

                <ul className="events">
                    {events.length > 0 && events.map((event: IEvent) => (
                        <li key={event.title} className="list-none">
                            <EventCard {...event} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

export default Page;
