/**
 * Store-timezone date helpers.
 *
 * Hosting platforms such as Vercel run servers in UTC. The shop works in
 * Pakistan time, so "today", "this week" and date filters must be computed in
 * the store's time zone, not the server's. Override with STORE_TIMEZONE.
 */
export const STORE_TZ = process.env.STORE_TIMEZONE || 'Asia/Karachi';

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: STORE_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: STORE_TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

const KEY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

// Date -> 'YYYY-MM-DD' as seen on the store's wall clock
export const toDayKey = (date) => dayKeyFormatter.format(date);

// Milliseconds the store zone is ahead of UTC at a given instant
const zoneOffsetMs = (date) => {
  const map = Object.fromEntries(partsFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
  return asUtc - (date.getTime() - date.getMilliseconds());
};

// Wall-clock time on a given store-local day -> real instant (Date)
const zonedDate = (key, h, m, s, ms) => {
  const match = KEY_RE.exec(String(key));
  if (!match) return new Date(NaN);
  const guess = Date.UTC(+match[1], +match[2] - 1, +match[3], h, m, s, ms);
  return new Date(guess - zoneOffsetMs(new Date(guess)));
};

// 'YYYY-MM-DD' -> first / last instant of that day in the store zone
export const startOfDayKey = (key) => zonedDate(key, 0, 0, 0, 0);
export const endOfDayKey = (key) => zonedDate(key, 23, 59, 59, 999);

// Convenience for "now"
export const startOfDay = (date = new Date()) => startOfDayKey(toDayKey(date));
export const endOfDay = (date = new Date()) => endOfDayKey(toDayKey(date));

// Start of the store-local day, n days before today (0 = today)
export const daysAgoStart = (n) => {
  const match = KEY_RE.exec(toDayKey(new Date()));
  const shifted = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3] - n));
  return startOfDayKey(shifted.toISOString().slice(0, 10));
};

// Start of the store-local month, n months before the current one
export const monthsAgoStart = (n) => {
  const match = KEY_RE.exec(toDayKey(new Date()));
  const shifted = new Date(Date.UTC(+match[1], +match[2] - 1 - n, 1));
  return startOfDayKey(shifted.toISOString().slice(0, 10));
};
