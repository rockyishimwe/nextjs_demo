"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";

type FormState = {
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
};

export type EventFormData = FormState & {
  tags: string[];
  agenda: string[];
  image: string;
};

const initialState: FormState = {
  title: "",
  description: "",
  overview: "",
  venue: "",
  location: "",
  date: "",
  time: "",
  mode: "offline",
  audience: "",
  organizer: "",
};

type CreateEventFormProps = {
  /** Present when editing an existing event — prefills the form. */
  initialData?: EventFormData;
  /** Present when editing: the event is updated via PATCH to this slug. */
  slug?: string;
};

const CreateEventForm = ({ initialData, slug }: CreateEventFormProps) => {
  const isEditing = Boolean(slug);

  const [form, setForm] = useState<FormState>(() =>
    initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          overview: initialData.overview,
          venue: initialData.venue,
          location: initialData.location,
          date: initialData.date,
          time: initialData.time,
          mode: initialData.mode,
          audience: initialData.audience,
          organizer: initialData.organizer,
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
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
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
      setError("Please choose a banner image for the event.");
      return;
    }
    if (tags.length === 0) {
      setError("Add at least one tag.");
      return;
    }
    if (agenda.length === 0) {
      setError("Add at least one agenda item.");
      return;
    }

    const formData = new FormData();
    (Object.keys(form) as (keyof FormState)[]).forEach((key) =>
      formData.append(key, form[key]),
    );
    formData.append("tags", JSON.stringify(tags));
    formData.append("agenda", JSON.stringify(agenda));
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
          &ldquo;{savedEvent.title}&rdquo; {isEditing ? "updated" : "created"}{" "}
          successfully!
        </p>
        <p>
          <Link
            href={`/events/${savedEvent.slug}` as Route}
            className="underline"
          >
            View the event page
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-8">
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <h3>Event Info</h3>

        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={set("title")}
            placeholder="e.g. DevFest Conference 2026"
            maxLength={100}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={set("description")}
            placeholder="Short summary shown on the event page"
            maxLength={1000}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="overview">Overview</label>
          <textarea
            id="overview"
            value={form.overview}
            onChange={set("overview")}
            placeholder="A few sentences about what attendees can expect"
            maxLength={500}
            required
          />
        </div>
      </div>

      <div className="card">
        <h3>When &amp; Where</h3>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="venue">Venue</label>
            <input
              id="venue"
              type="text"
              value={form.venue}
              onChange={set("venue")}
              placeholder="e.g. Main Auditorium"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              value={form.location}
              onChange={set("location")}
              placeholder="e.g. Kigali, Rwanda"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={form.date}
              onChange={set("date")}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="time">Time</label>
            <input
              id="time"
              type="time"
              value={form.time}
              onChange={set("time")}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="mode">Mode</label>
            <select id="mode" value={form.mode} onChange={set("mode")}>
              <option value="offline">Offline</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Audience &amp; Organizer</h3>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="audience">Audience</label>
            <input
              id="audience"
              type="text"
              value={form.audience}
              onChange={set("audience")}
              placeholder="e.g. Software Developers"
              required
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
              required
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Tags</h3>

        <div className="flex flex-row gap-3">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Type a tag and press Enter or Add"
            className="flex-1"
          />
          <button type="button" onClick={handleAddTag} className="add">
            Add
          </button>
        </div>

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

      <div className="card">
        <h3>Agenda</h3>

        <div className="flex flex-row gap-3">
          <input
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
            className="flex-1"
          />
          <button type="button" onClick={handleAddAgenda} className="add">
            Add
          </button>
        </div>

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

      <div className="card">
        <h3>Banner Image</h3>

        <div className="field">
          <label htmlFor="image">
            {isEditing ? "Replace image (optional)" : "Upload image"}
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required={!isEditing}
          />
        </div>

        {(preview || initialData?.image) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview ?? initialData!.image}
            alt="Banner preview"
            className="max-h-[300px] w-full rounded-lg object-cover"
          />
        )}
      </div>

      <button type="submit" className="submit" disabled={submitting}>
        {submitting
          ? isEditing
            ? "Saving changes…"
            : "Creating event…"
          : isEditing
            ? "Save Changes"
            : "Create Event"}
      </button>
    </form>
  );
};

export default CreateEventForm;
