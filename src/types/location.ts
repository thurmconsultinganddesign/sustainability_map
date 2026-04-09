export interface Program {
  institution: string;
  program: string;
  country: string;
  city: string;
  level: string;
  discipline: string; // May contain comma-separated tags, e.g. "Design, Engineering"
  focus: string; // May contain comma-separated tags, e.g. "Circular Economy, Regenerative Design"
  language: string;
  duration: string;
  url: string;
  description: string;
  // Computed from city + country lookup
  latitude: number;
  longitude: number;
}

/** All fields that users can filter by */
export type FilterField =
  | "country"
  | "city"
  | "level"
  | "discipline"
  | "focus"
  | "language"
  | "duration";

/** Fields where a single cell can have multiple comma-separated values (tags) */
export const MULTI_VALUE_FIELDS: FilterField[] = ["discipline", "focus"];

export const FILTER_FIELDS: { key: FilterField; label: string }[] = [
  { key: "country", label: "Country" },
  { key: "city", label: "City" },
  { key: "level", label: "Level" },
  { key: "discipline", label: "Discipline" },
  { key: "focus", label: "Focus" },
  { key: "language", label: "Language" },
  { key: "duration", label: "Duration" },
];

/**
 * Splits a potentially comma-separated field into individual trimmed tags.
 * Returns an array with one entry for plain fields.
 */
export function splitTags(value: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Check if a program field matches a filter value.
 * For multi-value fields (discipline, focus), checks if any tag matches.
 */
export function fieldMatches(
  program: Program,
  field: FilterField,
  filterValue: string
): boolean {
  const raw = program[field];
  if (MULTI_VALUE_FIELDS.includes(field)) {
    return splitTags(raw).some(
      (tag) => tag.toLowerCase() === filterValue.toLowerCase()
    );
  }
  return raw === filterValue;
}

/**
 * Check if a program field matches ANY of the selected filter values (OR logic within a field).
 * For multi-value fields (discipline, focus), checks if any tag matches any filter value.
 */
export function fieldMatchesMulti(
  program: Program,
  field: FilterField,
  filterValues: string[]
): boolean {
  if (filterValues.length === 0) return true;
  const raw = program[field];
  if (MULTI_VALUE_FIELDS.includes(field)) {
    const tags = splitTags(raw).map((t) => t.toLowerCase());
    return filterValues.some((fv) => tags.includes(fv.toLowerCase()));
  }
  return filterValues.some((fv) => raw === fv);
}

/**
 * Get all unique filter options for a field across all programs.
 * For multi-value fields, splits each cell into individual tags.
 */
export function getUniqueOptions(
  programs: Program[],
  field: FilterField
): string[] {
  const values = new Set<string>();
  for (const p of programs) {
    if (MULTI_VALUE_FIELDS.includes(field)) {
      for (const tag of splitTags(p[field])) {
        values.add(tag);
      }
    } else {
      const val = p[field];
      if (val) values.add(val);
    }
  }
  return Array.from(values).sort();
}
