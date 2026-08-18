import type { Metadata } from "next";
import { notFound } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Event from "@/app/database/event.model";
import CreateEventForm, { type EventFormData } from "@/components/CreateEventForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Event | DevEvent",
};

const EditEventPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  let event: EventFormData | null = null;
  try {
    await connectDB();
    const doc = await Event.findOne({ slug });
    if (doc) {
      event = {
        title: doc.title,
        description: doc.description,
        overview: doc.overview,
        venue: doc.venue,
        location: doc.location,
        date: doc.date,
        time: doc.time,
        mode: doc.mode,
        audience: doc.audience,
        organizer: doc.organizer,
        tags: doc.tags,
        agenda: doc.agenda,
        image: doc.image,
      };
    }
  } catch (error) {
    console.error("Failed to load event for edit:", error);
  }

  if (!event) return notFound();

  return (
    <section id="create-event">
      <h1 className="text-center">Edit Event</h1>

      <CreateEventForm initialData={event} slug={slug} />
    </section>
  );
};

export default EditEventPage;
