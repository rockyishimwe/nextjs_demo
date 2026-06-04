import ExploreBtn from "@/components/ExploreBtn"

const page = () => {
  return (
    <section>
      <h1 className="text-center">The Hub For Every Dev<br/>Event You Can't Miss</h1>
      <p className="text-center mt-5">Hackathons , Meetups, and Conferences, All in One Place</p>
      <ExploreBtn />
      <div className="mt-20 space-y-7">
        <h3>Featured 
          Events
          <ul className="events">{[1,2,3,4,5].map((event)=>(
            <li key={event}>Event {event}</li>
          ))}</ul>
        </h3>
      </div>
    </section>
    
  )
}

export default page