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
