"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Program, FilterField, FILTER_FIELDS, fieldMatches } from "@/types/location";
import { fetchPrograms } from "@/lib/data";
import SearchFilterBar from "@/components/SearchFilterBar";
import ProgramDrawer from "@/components/ProgramDrawer";
import SubmitProgramDrawer from "@/components/SubmitProgramDrawer";

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
  const [filters, setFilters] =
    useState<Record<FilterField, string | null>>(emptyFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  const handleProgramSelect = useCallback((program: Program) => {
    setSelectedProgram(program);
    setIsSubmitOpen(false); // close submit drawer if open
  }, []);

  const handleSubmitOpen = useCallback(() => {
    setIsSubmitOpen(true);
    setSelectedProgram(null); // close detail drawer if open
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSelectedProgram(null);
  }, []);

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
        if (value && !fieldMatches(p, field as FilterField, value))
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
    }).length;
  }, [programs, filters, searchQuery]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Loading programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-page-container">
      {/* Full-screen map */}
      <div className="map-wrapper">
        <MapView
          programs={programs}
          filters={filters}
          searchQuery={searchQuery}
          selectedProgram={selectedProgram}
          onMarkerClick={handleProgramSelect}
          onMapClick={handleDrawerClose}
        />
      </div>

      {/* Floating search & filter bar */}
      <SearchFilterBar
        programs={programs}
        filters={filters}
        onFilterChange={handleFilterChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        resultCount={filteredCount}
        onProgramSelect={handleProgramSelect}
      />

      {/* + Suggest button (top right) */}
      <button
        className="suggest-btn"
        onClick={handleSubmitOpen}
        aria-label="Suggest a program"
        title="Suggest a program"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="suggest-btn-label">Contribute</span>
      </button>

      {/* Program detail drawer */}
      <ProgramDrawer
        program={selectedProgram}
        onClose={handleDrawerClose}
      />

      {/* Submit program drawer */}
      <SubmitProgramDrawer
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        programs={programs}
      />
    </div>
  );
}
