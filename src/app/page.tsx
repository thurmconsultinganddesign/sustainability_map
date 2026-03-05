"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Program, FilterField, FILTER_FIELDS } from "@/types/location";
import { fetchPrograms } from "@/lib/data";
import FilterBar from "@/components/FilterBar";

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading map...</p>
    </div>
  ),
});

const emptyFilters: Record<FilterField, string | null> = {
  country: null,
  city: null,
  level: null,
  discipline: null,
  focus: null,
  language: null,
  duration: null,
};

export default function HomePage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filters, setFilters] = useState<Record<FilterField, string | null>>(emptyFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms().then((data) => {
      setPrograms(data);
      setLoading(false);
    });
  }, []);

  function handleFilterChange(field: FilterField, value: string | null) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  /** Count filtered results for the counter display */
  const filteredCount = useMemo(() => {
    return programs.filter((p) => {
      for (const [field, value] of Object.entries(filters)) {
        if (value && p[field as FilterField] !== value) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = [
          p.institution, p.program, p.country, p.city,
          p.level, p.discipline, p.focus, p.language,
        ].join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    }).length;
  }, [programs, filters, searchQuery]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            Sustainability &amp; Design Programs
          </h1>
          <FilterBar
            programs={programs}
            filters={filters}
            onFilterChange={handleFilterChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            resultCount={filteredCount}
          />
        </div>
      </header>

      {/* Map */}
      <main className="flex-1 relative">
        <MapView
          programs={programs}
          filters={filters}
          searchQuery={searchQuery}
        />
      </main>
    </div>
  );
}
