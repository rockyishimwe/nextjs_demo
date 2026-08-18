import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingConfirmation({
  email,
  eventTitle,
  date,
  time,
  venue,
  slug,
}: {
  email: string;
  eventTitle: string;
  date: string;
  time: string;
  venue: string;
  slug: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Skipping email dispatch.");
    return { success: false, message: "Email API key not configured" };
  }

  try {
    const eventUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://devevent.app"}/events/${slug}`;

    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || "DevEvent <onboarding@resend.dev>",
      to: [email],
      subject: `Registration Confirmed: ${eventTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #0f172a;">You're Registered!</h2>
          <p>Thank you for registering for <strong>${eventTitle}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;">📅 <strong>Date:</strong> ${date} at ${time}</p>
            <p style="margin: 5px 0;">📍 <strong>Location/Venue:</strong> ${venue}</p>
          </div>
          <p>You can view event details and updates here:</p>
          <a href="${eventUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 10px;">View Event Details</a>
          <p style="margin-top: 30px; font-size: 12px; color: #64748b;">See you at the event!<br/>DevEvent Team</p>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    return { success: false, error };
  }
}
