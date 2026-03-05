"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Program, FilterField } from "@/types/location";

// Fix Leaflet default icon issue with Next.js/webpack
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

/** Pin icon — a colored teardrop marker */
function createPinIcon() {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: #166534;
      width: 26px;
      height: 26px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
}

const pinIcon = createPinIcon();

/** Auto-fit map bounds to show all markers */
function FitBounds({ programs }: { programs: Program[] }) {
  const map = useMap();

  useEffect(() => {
    if (programs.length === 0) return;
    const bounds = L.latLngBounds(
      programs.map((p) => [p.latitude, p.longitude])
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [programs, map]);

  return null;
}

interface MapViewProps {
  programs: Program[];
  filters: Record<FilterField, string | null>;
  searchQuery: string;
  isEmbed?: boolean;
}

export default function MapView({
  programs,
  filters,
  searchQuery,
  isEmbed = false,
}: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      // Check all active filters
      for (const [field, value] of Object.entries(filters)) {
        if (value && p[field as FilterField] !== value) return false;
      }
      // Check search query across all text fields
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = [
          p.institution,
          p.program,
          p.country,
          p.city,
          p.level,
          p.discipline,
          p.focus,
          p.language,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [programs, filters, searchQuery]);

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[30, 0]}
      zoom={2}
      className="w-full h-full"
      zoomControl={!isEmbed}
    >
      {/* Watercolor base layer */}
      <TileLayer
        url={`https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=${process.env.NEXT_PUBLIC_STADIA_API_KEY}`}
      />
      {/* Borders and major roads overlay */}
      <TileLayer
        url={`https://tiles.stadiamaps.com/tiles/stamen_toner_lines/{z}/{x}/{y}{r}.png?api_key=${process.env.NEXT_PUBLIC_STADIA_API_KEY}`}
        opacity={0.3}
      />
      {/* Labels overlay — country names, cities on transparent background */}
      <TileLayer
        attribution='Map tiles by <a href="https://stamen.com">Stamen Design</a>, hosted by <a href="https://stadiamaps.com">Stadia Maps</a>. Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={`https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}{r}.png?api_key=${process.env.NEXT_PUBLIC_STADIA_API_KEY}`}
      />
      <FitBounds programs={filteredPrograms} />
      {filteredPrograms.map((program, index) => (
        <Marker
          key={`${program.institution}-${program.program}-${index}`}
          position={[program.latitude, program.longitude]}
          icon={pinIcon}
        >
          <Popup maxWidth={320} minWidth={240}>
            <div className="p-1">
              <h3 className="font-bold text-sm leading-tight mb-0.5">
                {program.program}
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                {program.institution}
              </p>

              <div className="flex flex-wrap gap-1 mb-2">
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                  {program.level}
                </span>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {program.discipline}
                </span>
              </div>

              <div className="text-xs text-gray-600 space-y-0.5">
                <p>
                  <span className="font-medium">Focus:</span> {program.focus}
                </p>
                <p>
                  <span className="font-medium">Location:</span> {program.city},{" "}
                  {program.country}
                </p>
                {program.language && (
                  <p>
                    <span className="font-medium">Language:</span>{" "}
                    {program.language}
                  </p>
                )}
                {program.duration && (
                  <p>
                    <span className="font-medium">Duration:</span>{" "}
                    {program.duration}
                  </p>
                )}
              </div>

              {program.url && (
                <a
                  href={program.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-2 inline-block font-medium"
                >
                  View program →
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
