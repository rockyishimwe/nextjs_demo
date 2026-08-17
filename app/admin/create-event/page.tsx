import type { Metadata } from "next";
import CreateEventForm from "@/components/CreateEventForm";

export const metadata: Metadata = {
  title: "Create Event | DevEvent",
};

const CreateEventPage = () => {
  return (
    <section id="create-event">
      <h1 className="text-center">Create an Event</h1>

      <CreateEventForm />
    </section>
  );
};

export default CreateEventPage;
