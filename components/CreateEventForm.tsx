"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";

type FormState = {
  title: string;
  date: string;
  time: string;
  venue: string;
  mode: string;
  description: string;
  overview: string;
  location: string;
  audience: string;
  organizer: string;
  capacity: string;
};

export type EventFormData = {
  title: string;
  description: string;
  overview: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  organizer: string;
  tags: string[];
  agenda: string[];
  capacity?: number;
  image: string;
};

const initialState: FormState = {
  title: "",
  date: "",
  time: "",
  venue: "",
  mode: "",
  description: "",
  overview: "",
  location: "",
  audience: "",
  organizer: "",
  capacity: "",
};

type CreateEventFormProps = {
  /** Present when editing an existing event — prefills the form. */
  initialData?: EventFormData;
  /** Present when editing: the event is updated via PATCH to this slug. */
  slug?: string;
};

const truncate = (value: string, max: number): string =>
  value.length > max ? `${value.slice(0, max - 3)}...` : value;

const deriveOverview = (description: string): string =>
  truncate(description.trim() || "Event overview", 500);

const deriveAgenda = (description: string): string[] => {
  const firstLine = description.trim().split("\n")[0].trim();
  return firstLine ? [truncate(firstLine, 80)] : ["Main event"];
};

const CloudIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const CreateEventForm = ({ initialData, slug }: CreateEventFormProps) => {
  const isEditing = Boolean(slug);

  const [form, setForm] = useState<FormState>(() =>
    initialData
      ? {
          title: initialData.title,
          date: initialData.date,
          time: initialData.time,
          venue: initialData.venue,
          mode: initialData.mode,
          description: initialData.description,
          overview: initialData.overview,
          location: initialData.location,
          audience: initialData.audience,
          organizer: initialData.organizer,
          capacity: initialData.capacity ? String(initialData.capacity) : "",
        }
      : initialState,
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [agenda, setAgenda] = useState<string[]>(initialData?.agenda ?? []);
  const [agendaInput, setAgendaInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedEvent, setSavedEvent] = useState<{
    slug: string;
    title: string;
  } | null>(null);

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAddTag = () => {
    const value = tagInput.trim();
    if (value && !tags.includes(value)) {
      setTags((t) => [...t, value]);
    }
    setTagInput("");
  };

  const handleAddAgenda = () => {
    const value = agendaInput.trim();
    if (value && !agenda.includes(value)) {
      setAgenda((a) => [...a, value]);
    }
    setAgendaInput("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEditing && !image) {
      setError("Please upload an event image or banner.");
      return;
    }
    if (!form.mode) {
      setError("Please select an event type.");
      return;
    }
    if (tags.length === 0) {
      setError("Add at least one tag.");
      return;
    }

    const capacityRaw = form.capacity.trim();
    let capacity: number | undefined;
    if (capacityRaw) {
      capacity = parseInt(capacityRaw, 10);
      if (Number.isNaN(capacity) || capacity < 1) {
        setError("Capacity must be a positive number.");
        return;
      }
    }

    // Fall back to sensible defaults when optional fields are left empty.
    const overview = form.overview.trim() || deriveOverview(form.description);
    const location = form.location.trim() || form.venue;
    const audience = form.audience.trim() || "Everyone";
    const organizer = form.organizer.trim() || "DevEvent Team";
    const agendaItems = agenda.length > 0 ? agenda : deriveAgenda(form.description);

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("overview", overview);
    formData.append("venue", form.venue);
    formData.append("location", location);
    formData.append("date", form.date);
    formData.append("time", form.time);
    formData.append("mode", form.mode);
    formData.append("audience", audience);
    formData.append("organizer", organizer);
    formData.append("tags", JSON.stringify(tags));
    formData.append("agenda", JSON.stringify(agendaItems));
    if (capacity !== undefined) {
      formData.append("capacity", String(capacity));
    }
    // Only send a new image when one was actually chosen (edit mode keeps
    // the existing banner otherwise).
    if (image) {
      formData.append("image", image);
    }

    setSubmitting(true);
    try {
      const url = isEditing ? `/api/events/${slug}` : "/api/events";
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || `Request failed with status ${res.status}.`);
      } else {
        setSavedEvent({ slug: data.event.slug, title: data.event.title });
      }
    } catch {
      setError("Network error — could not reach the events API.");
    } finally {
      setSubmitting(false);
    }
  };

  if (savedEvent) {
    return (
      <div className="success" role="status">
        <p className="text-lg font-semibold">
          &ldquo;{savedEvent.title}&rdquo; {isEditing ? "updated" : "created"} successfully!
        </p>
        <p>
          <Link href={`/events/${savedEvent.slug}` as Route} className="underline">
            View the event page
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl flex-col gap-6">
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <div className="field">
        <label htmlFor="title">Event Title</label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={set("title")}
          placeholder="Enter event title"
          maxLength={100}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="date">Event Date</label>
        <div className="input-wrap">
          <img src="/icons/calendar.svg" alt="" width={16} height={16} className="icon" />
          <input
            id="date"
            type="date"
            value={form.date}
            onChange={set("date")}
            placeholder="Select event date"
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="time">Event Time</label>
        <div className="input-wrap">
          <img src="/icons/clock.svg" alt="" width={16} height={16} className="icon" />
          <input
            id="time"
            type="time"
            value={form.time}
            onChange={set("time")}
            placeholder="Select start time"
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="venue">Event Location</label>
        <div className="input-wrap">
          <img src="/icons/pin.svg" alt="" width={16} height={16} className="icon" />
          <input
            id="venue"
            type="text"
            value={form.venue}
            onChange={set("venue")}
            placeholder="Enter venue or online link"
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="mode">Event Type</label>
        <div className="input-wrap">
          <select id="mode" value={form.mode} onChange={set("mode")} required>
            <option value="" disabled>
              Select event type
            </option>
            <option value="offline">Offline</option>
            <option value="online">Online</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <img src="/icons/arrow-down.svg" alt="" width={16} height={16} className="chevron" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="image">Event Image / Banner</label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="sr-only"
          required={!isEditing}
        />
        <label htmlFor="image" className="upload-box">
          {preview ? (
            <>
              <img
                src={preview}
                alt="Banner preview"
                className="max-h-[220px] w-full rounded-[8px] object-cover"
              />
              <span className="text-light-100 text-sm">{image?.name} — click to replace</span>
            </>
          ) : initialData?.image && isEditing ? (
            <>
              <img
                src={initialData.image}
                alt="Current banner"
                className="max-h-[220px] w-full rounded-[8px] object-cover"
              />
              <span className="text-light-100 text-sm">Click to replace the current banner</span>
            </>
          ) : (
            <>
              <CloudIcon />
              <span className="text-light-100 text-sm font-medium">
                Upload event image or banner
              </span>
            </>
          )}
        </label>
      </div>

      <div className="field">
        <label htmlFor="tags">Tags</label>
        <input
          id="tags"
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            }
          }}
          placeholder="Add tags such as react, next, js"
        />
        {tags.length > 0 && (
          <div className="chips">
            {tags.map((tag) => (
              <span key={tag} className="chip">
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() => setTags((t) => t.filter((x) => x !== tag))}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="description">Event Description</label>
        <textarea
          id="description"
          value={form.description}
          onChange={set("description")}
          placeholder="Briefly describe the event"
          maxLength={1000}
          required
        />
      </div>

      <details className="more-details">
        <summary>More details (optional)</summary>

        <div className="flex flex-col gap-6 pt-4">
          <div className="field">
            <label htmlFor="overview">Overview</label>
            <textarea
              id="overview"
              value={form.overview}
              onChange={set("overview")}
              placeholder="A few sentences about what attendees can expect"
              maxLength={500}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="location">Location / City</label>
              <input
                id="location"
                type="text"
                value={form.location}
                onChange={set("location")}
                placeholder="e.g. Kigali, Rwanda"
              />
            </div>

            <div className="field">
              <label htmlFor="audience">Audience</label>
              <input
                id="audience"
                type="text"
                value={form.audience}
                onChange={set("audience")}
                placeholder="e.g. Software Developers"
              />
            </div>

            <div className="field">
              <label htmlFor="organizer">Organizer</label>
              <input
                id="organizer"
                type="text"
                value={form.organizer}
                onChange={set("organizer")}
                placeholder="e.g. DevEvent Team"
              />
            </div>

            <div className="field">
              <label htmlFor="capacity">Capacity (max attendees)</label>
              <input
                id="capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={set("capacity")}
                placeholder="e.g. 500 — leave empty for unlimited"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="agenda">Agenda</label>
            <input
              id="agenda"
              type="text"
              value={agendaInput}
              onChange={(e) => setAgendaInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddAgenda();
                }
              }}
              placeholder="e.g. Opening keynote, Workshops, Networking"
            />
            {agenda.length > 0 && (
              <ol className="agenda-list">
                {agenda.map((item, i) => (
                  <li key={item}>
                    <span>
                      {i + 1}. {item}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item}`}
                      onClick={() => setAgenda((a) => a.filter((x) => x !== item))}
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </details>

      <button type="submit" className="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save Event"}
      </button>
    </form>
  );
};

export default CreateEventForm;
