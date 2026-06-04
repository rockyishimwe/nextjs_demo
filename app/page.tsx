import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn";
const events = [
  {image:"/images/event1.png",title:"Hack the Future", date:"Aug 15, 2026", location:"Oslo, Norway",slug:"event-1"},
  {image:"/images/event2.png",title:"CodeCon 2026", date:"Sep 10, 2026", location:"San Francisco, USA",slug:"event-2"},
  {image:"/images/event3.png",title:"DevSummit", date:"Oct 5, 2026", location:"Berlin, Germany",slug:"event-3"},
]

const page = () => {
  return (
    <section>
            <h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
            <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

            <ExploreBtn />

            <div className="mt-20 space-y-7">
                <h3>Featured Events</h3>

                <ul className="events">
                    {events.map((event) => (
                        <li key={event.title} className="list-none">
                            <EventCard {...event} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    
  )
}

export default page