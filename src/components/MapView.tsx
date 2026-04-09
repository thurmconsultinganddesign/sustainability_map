"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  AttributionControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { Program, FilterField, fieldMatchesMulti } from "@/types/location";

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
const pinIcon = L.divIcon({
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

/** Active (selected) pin icon — darker/highlighted */
const activePinIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="
    background-color: #111;
    width: 30px;
    height: 30px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.45);
  "></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

/** Auto-fit map bounds to show all markers. */
function FitBounds({ programs }: { programs: Program[] }) {
  const map = useMap();

  useEffect(() => {
    if (programs.length === 0) return;
    const bounds = L.latLngBounds(
      programs.map((p) => [p.latitude, p.longitude])
    );

    // Cap zoom so we never go deeper than city level
    // (locations are approximate — street-level zoom is misleading)
    const MAX_CITY_ZOOM = 11;

    const isMobile = window.innerWidth <= 640;
    if (isMobile) {
      map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: Math.min(4, MAX_CITY_ZOOM),
        animate: false,
      });
      const currentZoom = map.getZoom();
      if (currentZoom < 2) {
        map.setZoom(2, { animate: false });
      }
    } else {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: MAX_CITY_ZOOM,
      });
    }
  }, [programs, map]);

  return null;
}

/**
 * Fly to a selected program with smart offset so the marker
 * ends up in the visible portion of the map (not behind the drawer).
 *
 * Desktop: drawer is 400px on the right → offset marker to left half
 * Mobile: drawer covers bottom ~60% → offset marker to upper portion
 */
function FlyToSelected({ program }: { program: Program | null }) {
  const map = useMap();

  useEffect(() => {
    if (!program) return;

    const targetLatLng = L.latLng(program.latitude, program.longitude);
    const isMobile = window.innerWidth <= 640;
    const DRAWER_WIDTH = 400; // px, desktop drawer width
    const zoom = 5;

    if (isMobile) {
      // Offset the target upward so the marker sits in the visible top ~40%
      // of the viewport (bottom 60% is covered by the drawer)
      const mapHeight = map.getSize().y;
      const drawerHeight = mapHeight * 0.55;
      const targetPoint = map.project(targetLatLng, zoom);
      // Move the target up by half the drawer height so it centers in the visible area
      targetPoint.y += drawerHeight / 2;
      const offsetLatLng = map.unproject(targetPoint, zoom);
      map.flyTo(offsetLatLng, zoom, { duration: 0.8 });
    } else {
      // Offset the target to the left so the marker sits in the visible area
      // (right side is covered by the 400px drawer)
      const targetPoint = map.project(targetLatLng, zoom);
      targetPoint.x += DRAWER_WIDTH / 2;
      const offsetLatLng = map.unproject(targetPoint, zoom);
      map.flyTo(offsetLatLng, zoom, { duration: 0.8 });
    }
  }, [program, map]);

  return null;
}

/** Close drawer when user clicks empty map area */
function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click: () => {
      onMapClick();
    },
  });
  return null;
}

interface MapViewProps {
  programs: Program[];
  filters: Record<FilterField, string[]>;
  searchQuery: string;
  isEmbed?: boolean;
  selectedProgram?: Program | null;
  onMarkerClick?: (program: Program) => void;
  onMapClick?: () => void;
}

export default function MapView({
  programs,
  filters,
  searchQuery,
  isEmbed = false,
  selectedProgram = null,
  onMarkerClick,
  onMapClick,
}: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      for (const [field, values] of Object.entries(filters)) {
        if ((values as string[]).length > 0 && !fieldMatchesMulti(p, field as FilterField, values as string[]))
          return false;
      }
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

  const handleMapClick = useCallback(() => {
    if (onMapClick) onMapClick();
  }, [onMapClick]);

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  const selectedKey = selectedProgram
    ? `${selectedProgram.institution}-${selectedProgram.program}`
    : null;

  return (
    <MapContainer
      center={[30, 0]}
      zoom={2}
      className={`w-full h-full ${isEmbed ? "embed-map" : ""}`}
      zoomControl={!isEmbed}
      attributionControl={false}
    >
      <AttributionControl position="bottomright" prefix={false} />
      <TileLayer
        url={`https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=${process.env.NEXT_PUBLIC_STADIA_API_KEY}`}
      />
      <TileLayer
        url={`https://tiles.stadiamaps.com/tiles/stamen_toner_lines/{z}/{x}/{y}{r}.png?api_key=${process.env.NEXT_PUBLIC_STADIA_API_KEY}`}
        opacity={0.3}
      />
      <TileLayer
        attribution='Map tiles by <a href="https://stamen.com">Stamen Design</a>, hosted by <a href="https://stadiamaps.com">Stadia Maps</a>. Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={`https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}{r}.png?api_key=${process.env.NEXT_PUBLIC_STADIA_API_KEY}`}
      />
      <FitBounds programs={filteredPrograms} />
      <FlyToSelected program={selectedProgram} />
      <MapClickHandler onMapClick={handleMapClick} />
      {filteredPrograms.map((program, index) => {
        const key = `${program.institution}-${program.program}`;
        const isSelected = key === selectedKey;
        return (
          <Marker
            key={`${key}-${index}`}
            position={[program.latitude, program.longitude]}
            icon={isSelected ? activePinIcon : pinIcon}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) onMarkerClick(program);
              },
            }}
          />
        );
      })}
    </MapContainer>
  );
}
