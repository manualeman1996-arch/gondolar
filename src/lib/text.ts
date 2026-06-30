/**
 * Normalizes free text for search/matching: lowercases, strips diacritics
 * (accents), collapses whitespace. Mirrors the Postgres `unaccent(lower(...))`
 * used in the search function so client + server agree.
 */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Builds a short, human location string e.g. "Pasillo 4 · Góndola derecha · Altura media". */
export function locationSummary(parts: {
  aisle?: string | null;
  shelf?: string | null;
  side?: string | null;
  height?: string | null;
  zone?: string | null;
}): string {
  const chunks: string[] = [];
  if (parts.aisle) chunks.push(`Pasillo ${parts.aisle}`);
  if (parts.shelf) chunks.push(`Góndola ${parts.shelf}`);
  if (parts.side) chunks.push(parts.side);
  if (parts.height) chunks.push(`Altura ${parts.height}`);
  if (parts.zone && chunks.length === 0) chunks.push(parts.zone);
  return chunks.join(" · ");
}

export function slugify(input: string): string {
  return normalize(input)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
