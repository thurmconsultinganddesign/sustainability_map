"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Program, FilterField } from "@/types/location";
import { fetchPrograms } from "@/lib/data";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading map...</p>
    </div>
  ),
});

/**
 * Embed page — renders ONLY the map (no header, no filters).
 * Use in iframes: <iframe src="https://yourdomain.com/embed" />
 *
 * Optional URL params for pre-filtering:
 *   ?country=UK
 *   ?level=Master
 *   ?discipline=Design
 *   ?search=Berlin
 */
export default function EmbedPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<FilterField, string | null>>({
    country: null, city: null, level: null,
    discipline: null, focus: null, language: null, duration: null,
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setFilters({
      country: params.get("country"),
      city: params.get("city"),
      level: params.get("level"),
      discipline: params.get("discipline"),
      focus: params.get("focus"),
      language: params.get("language"),
      duration: params.get("duration"),
    });
    setSearch(params.get("search") || "");

    fetchPrograms().then((data) => {
      setPrograms(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <MapView
        programs={programs}
        filters={filters}
        searchQuery={search}
        isEmbed={true}
      />
    </div>
  );
}
