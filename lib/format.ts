const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * "2026-09-15" → "15th September 2026"
 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;

  const suffix =
    d % 10 === 1 && d !== 11
      ? "st"
      : d % 10 === 2 && d !== 12
        ? "nd"
        : d % 10 === 3 && d !== 13
          ? "rd"
          : "th";

  return `${d}${suffix} ${MONTHS[m - 1]} ${y}`;
}

/**
 * "14:25" → "2:25pm"
 */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;

  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")}${period}`;
}
