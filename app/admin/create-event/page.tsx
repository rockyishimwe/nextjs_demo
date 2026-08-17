import type { Metadata } from "next";
import CreateEventForm from "@/components/CreateEventForm";

export const metadata: Metadata = {
  title: "Create Event | DevEvent",
};

const CreateEventPage = () => {
  return (
    <section id="create-event">
      <div className="mb-10 flex flex-col items-start gap-4">
        <h1>Create Event</h1>
        <p className="text-light-100 text-lg max-sm:text-sm">
          Fill in the details below to publish a new event. The banner image is
          uploaded to Cloudinary.
        </p>
      </div>

      <CreateEventForm />
    </section>
  );
};

export default CreateEventPage;
