/**
 * City → lat/lng lookup table.
 * This avoids needing a geocoding API. We map "City, Country" to coordinates.
 * New cities are added as the dataset grows.
 */
const CITY_COORDS: Record<string, [number, number]> = {
  // Italy
  "milan, italy": [45.4642, 9.19],

  // UK
  "kingston upon thames, uk": [51.4123, -0.3007],
  "london, uk": [51.5074, -0.1278],

  // Sweden
  "gothenburg, sweden": [57.7089, 11.9746],
  "stockholm, sweden": [59.3293, 18.0686],

  // Netherlands
  "arnhem, netherlands": [51.9851, 5.8987],
  "delft, netherlands": [52.0116, 4.3571],
  "eindhoven, netherlands": [51.4416, 5.4697],

  // Spain
  "barcelona, spain": [41.3874, 2.1686],

  // USA
  "cambridge, ma, usa": [42.3736, -71.1097],
  "stanford, ca, usa": [37.4275, -122.1697],
  "berkeley, ca, usa": [37.8716, -122.2727],
  "new haven, ct, usa": [41.3083, -72.9279],

  // Singapore
  "singapore, singapore": [1.3521, 103.8198],

  // China
  "shanghai, china": [31.2304, 121.4737],

  // Australia
  "sydney, australia": [-33.8688, 151.2093],
  "melbourne, australia": [-37.8136, 144.9631],

  // Chile
  "santiago, chile": [-33.4489, -70.6693],

  // Norway
  "trondheim, norway": [63.4305, 10.3951],

  // Finland
  "helsinki, finland": [60.1699, 24.9384],

  // Austria
  "vienna, austria": [48.2082, 16.3738],

  // Ireland
  "dublin, ireland": [53.3498, -6.2603],
};

/**
 * Look up coordinates for a city + country combination.
 * Returns [latitude, longitude] or null if not found.
 */
export function geocodeCity(
  city: string,
  country: string
): [number, number] | null {
  // Clean up the inputs
  const cleanCity = city.replace(/"/g, "").trim();
  const cleanCountry = country.replace(/"/g, "").trim();

  // Try exact match: "city, country"
  const key = `${cleanCity}, ${cleanCountry}`.toLowerCase();
  if (CITY_COORDS[key]) return CITY_COORDS[key];

  // Try just the city name (for unique cities like "Singapore")
  for (const [coordKey, coords] of Object.entries(CITY_COORDS)) {
    if (coordKey.startsWith(cleanCity.toLowerCase() + ",")) return coords;
  }

  console.warn(`No coordinates found for: ${cleanCity}, ${cleanCountry}`);
  return null;
}
