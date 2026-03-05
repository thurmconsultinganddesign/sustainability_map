export interface Program {
  institution: string;
  program: string;
  country: string;
  city: string;
  level: string;
  discipline: string;
  focus: string;
  language: string;
  duration: string;
  url: string;
  // Computed from city + country lookup
  latitude: number;
  longitude: number;
}

/** All fields that users can filter by */
export type FilterField = "country" | "city" | "level" | "discipline" | "focus" | "language" | "duration";

export const FILTER_FIELDS: { key: FilterField; label: string }[] = [
  { key: "country", label: "Country" },
  { key: "level", label: "Level" },
  { key: "discipline", label: "Discipline" },
  { key: "focus", label: "Focus" },
  { key: "language", label: "Language" },
  { key: "duration", label: "Duration" },
];
