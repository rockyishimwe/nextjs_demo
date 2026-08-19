/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import { formatDate, formatTime } from "@/lib/format";

interface Props {
  title: string;
  image: string;
  slug: string;
  location: string;
  date: string;
  time: string;
}

const EventCard = ({ title, image, slug, location, date, time }: Props) => {
  return (
    <Link href={`/events/${slug}` as Route} id="event-card">
      <div className="relative h-[300px] w-full">
        <Image
          src={image}
          alt={title}
          fill
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAFRABAQAAAAAAAAAAAAAAAAAAAAf/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AaAB//9k="
          className="rounded-lg object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
      </div>

      <div className="flex flex-row gap-2">
        <img src="/icons/pin.svg" alt="location" width={14} height={14} />
        <p>{location}</p>
      </div>

      <p className="title">{title}</p>

      <div className="datetime">
        <div>
          <img src="/icons/calendar.svg" alt="date" width={14} height={14} />
          <p>{formatDate(date)}</p>
        </div>
        <div>
          <img src="/icons/clock.svg" alt="time" width={14} height={14} />
          <p>{formatTime(time)}</p>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
