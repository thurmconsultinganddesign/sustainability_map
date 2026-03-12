import Papa from "papaparse";
import { Program } from "@/types/location";
import { geocodeCity } from "./geocode";

/**
 * Fetches program data from a published Google Sheet CSV.
 * Parses each row, geocodes the city, and returns Program objects.
 */
export async function fetchPrograms(): Promise<Program[]> {
  const csvUrl = process.env.NEXT_PUBLIC_SHEET_CSV_URL;

  if (!csvUrl) {
    console.warn(
      "NEXT_PUBLIC_SHEET_CSV_URL is not set. Using sample data instead."
    );
    return getSampleData();
  }

  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error("Failed to fetch programs from Google Sheet:", error);
    return getSampleData();
  }
}

/**
 * Parses CSV text into Program objects.
 * Handles the quirks in the real data (extra quotes, missing fields, duplicates).
 */
function parseCSV(csvText: string): Program[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const seen = new Set<string>();

  return parsed.data
    .map((row) => {
      // Clean up values — remove stray quotes from badly formatted rows
      const clean = (val: string | undefined) =>
        (val || "").replace(/^"+|"+$/g, "").trim();

      const institution = clean(row["institution"]);
      const program = clean(row["program"]);
      const country = clean(row["country"]);
      const city = clean(row["city"]);
      const level = clean(row["level"]);
      const discipline = clean(row["discipline"]);
      const focus = clean(row["focus"]);
      const language = clean(row["language"]);
      const duration = clean(row["duration"]);
      const url = clean(row["url"]);
      const description = clean(row["description"]);

      // Skip rows with no institution or program
      if (!institution || !program) return null;

      // Deduplicate by institution + program combo
      const dedupeKey = `${institution}|${program}`.toLowerCase();
      if (seen.has(dedupeKey)) return null;
      seen.add(dedupeKey);

      // Geocode city + country to get coordinates
      const coords = geocodeCity(city, country);
      if (!coords) return null;

      return {
        institution,
        program,
        country,
        city,
        level,
        discipline,
        focus,
        language,
        duration,
        url,
        description,
        latitude: coords[0],
        longitude: coords[1],
      } as Program;
    })
    .filter((p): p is Program => p !== null);
}

/** Sample data for development when no Google Sheet is connected */
function getSampleData(): Program[] {
  return [
    {
      institution: "POLIMI Graduate School of Management",
      program: "Master in Entrepreneurship and Design for Sustainability",
      country: "Italy",
      city: "Milan",
      level: "Master",
      discipline: "Design",
      focus: "Sustainability (general)",
      language: "English",
      duration: "12 months",
      url: "",
      description: "",
      latitude: 45.4642,
      longitude: 9.19,
    },
    {
      institution: "Central Saint Martins (UAL)",
      program: "MA Regenerative Design",
      country: "UK",
      city: "London",
      level: "MA",
      discipline: "Design/Textiles",
      focus: "Regenerative Design, Biodiversity",
      language: "English",
      duration: "2 years",
      url: "",
      description: "",
      latitude: 51.5074,
      longitude: -0.1278,
    },
    {
      institution: "TU Delft",
      program: "Sustainable Design Engineering",
      country: "Netherlands",
      city: "Delft",
      level: "MSc",
      discipline: "Design/Engineering",
      focus: "Sustainable Products",
      language: "English",
      duration: "2 years",
      url: "",
      description: "",
      latitude: 52.0116,
      longitude: 4.3571,
    },
    {
      institution: "Harvard Graduate School of Design",
      program: "Master in Design Studies - Ecologies",
      country: "USA",
      city: "Cambridge, MA",
      level: "MDes",
      discipline: "Design Studies",
      focus: "Climate Resiliency",
      language: "English",
      duration: "2 years",
      url: "",
      description: "",
      latitude: 42.3736,
      longitude: -71.1097,
    },
    {
      institution: "Aalto University",
      program: "Design for Sustainability",
      country: "Finland",
      city: "Helsinki",
      level: "Master",
      discipline: "Design",
      focus: "Sustainable Materials",
      language: "English",
      duration: "2 years",
      url: "",
      description: "",
      latitude: 60.1699,
      longitude: 24.9384,
    },
  ];
}
