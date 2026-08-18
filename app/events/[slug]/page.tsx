import { Suspense } from "react";
import EventDetails from "@/components/EventDetails";
import Event from "@/app/database/event.model";
import connectDB from "@/lib/mongodb";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    await connectDB();
    const event = await Event.findOne({ slug }).lean();
    if (!event) {
      return {
        title: "Event Not Found | DevEvent",
        description: "The requested event could not be found.",
      };
    }
    return {
      title: `${event.title} | DevEvent`,
      description: event.overview || event.description.substring(0, 160),
      openGraph: {
        title: event.title,
        description: event.overview || event.description.substring(0, 160),
        images: [event.image],
        type: "website",
      },
    };
  } catch {
    return {
      title: "DevEvent",
      description: "The Hub for Every Dev Event You Mustn't Miss",
    };
  }
}

const EventDetailsPage = async ({ params }: Props) => {
  const { slug } = await params;
  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <EventDetails slug={slug} />
      </Suspense>
    </main>
  );
};
export default EventDetailsPage;
