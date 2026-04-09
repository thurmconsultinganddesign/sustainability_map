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
  const [filters, setFilters] = useState<Record<FilterField, string[]>>({
    country: [], city: [], level: [],
    discipline: [], focus: [], language: [], duration: [],
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const toArr = (v: string | null) => v ? [v] : [];

    setFilters({
      country: toArr(params.get("country")),
      city: toArr(params.get("city")),
      level: toArr(params.get("level")),
      discipline: toArr(params.get("discipline")),
      focus: toArr(params.get("focus")),
      language: toArr(params.get("language")),
      duration: toArr(params.get("duration")),
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
