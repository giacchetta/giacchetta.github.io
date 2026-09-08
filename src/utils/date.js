// Frontmatter dates are parsed as UTC midnight by Zod (src/content.config.ts).
// Format in UTC so the rendered day matches the authored date regardless of build-machine TZ.
export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// First 4-digit year in a free-text period, e.g. "November 2024 - Present" -> 2024.
export function periodStartYear(period) {
  const match = /(\d{4})/.exec(period ?? '');
  return match ? Number(match[1]) : null;
}
