/**
 * City → lat/lng lookup table.
 * This avoids needing a geocoding API for known cities.
 * Unknown cities fall back to the Nominatim (OpenStreetMap) API.
 * New cities are added here as the dataset grows for faster lookups.
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

  // Lithuania
  "kaunas, lithuania": [54.8985, 23.9036],

  // South Africa
  "capetown, south africa": [-33.9249, 18.4241],
  "cape town, south africa": [-33.9249, 18.4241],

  // Switzerland
  "lucerne, switzerland": [47.0502, 8.3093],
};

/**
 * In-memory cache for API lookups so we don't re-fetch the same city.
 */
const apiCache: Record<string, [number, number] | null> = {};

/**
 * Look up coordinates for a city + country combination.
 * First checks the hardcoded table, then falls back to the Nominatim API.
 * Returns [latitude, longitude] or null if not found.
 */
export async function geocodeCity(
  city: string,
  country: string
): Promise<[number, number] | null> {
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

  // Check API cache
  if (key in apiCache) return apiCache[key];

  // Fall back to Nominatim (OpenStreetMap) geocoding API
  try {
    const query = encodeURIComponent(`${cleanCity}, ${cleanCountry}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "SustainabilityMap/1.0",
        },
      }
    );

    if (!response.ok) {
      console.warn(`Nominatim API error for: ${cleanCity}, ${cleanCountry}`);
      apiCache[key] = null;
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      const coords: [number, number] = [
        parseFloat(data[0].lat),
        parseFloat(data[0].lon),
      ];
      apiCache[key] = coords;
      console.log(`Geocoded via API: ${cleanCity}, ${cleanCountry} → [${coords}]`);
      return coords;
    }

    console.warn(`No results from Nominatim for: ${cleanCity}, ${cleanCountry}`);
    apiCache[key] = null;
    return null;
  } catch (error) {
    console.warn(`Geocoding failed for: ${cleanCity}, ${cleanCountry}`, error);
    apiCache[key] = null;
    return null;
  }
}
