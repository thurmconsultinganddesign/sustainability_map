"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Program, FilterField, FILTER_FIELDS, fieldMatchesMulti } from "@/types/location";
import { fetchPrograms } from "@/lib/data";
import SearchFilterBar, { ViewMode } from "@/components/SearchFilterBar";
import ProgramDrawer from "@/components/ProgramDrawer";
import SubmitProgramDrawer from "@/components/SubmitProgramDrawer";
import AboutDrawer from "@/components/AboutDrawer";
import LegalDrawer from "@/components/LegalDrawer";
import ProgrammeList from "@/components/ProgrammeList";

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading map...</p>
    </div>
  ),
});

const emptyFilters: Record<FilterField, string[]> = {
  country: [],
  city: [],
  level: [],
  discipline: [],
  focus: [],
  language: [],
  duration: [],
};

export default function HomePage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filters, setFilters] =
    useState<Record<FilterField, string[]>>(emptyFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("map");

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

  function handleFiltersApply(newFilters: Record<FilterField, string[]>) {
    setFilters(newFilters);
  }

  function handleFilterRemove(field: FilterField, value: string) {
    setFilters((prev) => ({
      ...prev,
      [field]: prev[field].filter((v) => v !== value),
    }));
  }

  function handleFiltersClearAll() {
    setFilters(emptyFilters);
  }

  /** Filtered programmes list (used for both count display and list view) */
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      for (const [field, values] of Object.entries(filters)) {
        if (values.length > 0 && !fieldMatchesMulti(p, field as FilterField, values))
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

  const filteredCount = filteredPrograms.length;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Loading programmes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-page-container">
      {/* Full-screen map (hidden when list view active) */}
      <div className="map-wrapper" style={{ display: viewMode === "map" ? "block" : "none" }}>
        <MapView
          programs={programs}
          filters={filters}
          searchQuery={searchQuery}
          selectedProgram={selectedProgram}
          onMarkerClick={handleProgramSelect}
          onMapClick={handleDrawerClose}
        />
      </div>

      {/* List view: search bar + list in normal flow */}
      {viewMode === "list" && (
        <div className="list-wrapper">
          <div className="list-search-area">
            <SearchFilterBar
              programs={programs}
              filters={filters}
              onFiltersApply={handleFiltersApply}
              onFilterRemove={handleFilterRemove}
              onFiltersClearAll={handleFiltersClearAll}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              resultCount={filteredCount}
              onProgramSelect={handleProgramSelect}
              onFiltersOpen={() => {
                setSelectedProgram(null);
                setIsSubmitOpen(false);
              }}
              isListMode
            />
          </div>
          <ProgrammeList
            programs={filteredPrograms}
            onProgramSelect={handleProgramSelect}
            selectedProgram={selectedProgram}
          />
        </div>
      )}

      {/* Floating search & filter bar (map mode only) */}
      {viewMode === "map" && (
        <SearchFilterBar
          programs={programs}
          filters={filters}
          onFiltersApply={handleFiltersApply}
          onFilterRemove={handleFilterRemove}
          onFiltersClearAll={handleFiltersClearAll}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          resultCount={filteredCount}
          onProgramSelect={handleProgramSelect}
          onFiltersOpen={() => {
            setSelectedProgram(null);
            setIsSubmitOpen(false);
          }}
        />
      )}

      {/* + Suggest button (top right) */}
      <button
        className="suggest-btn"
        onClick={handleSubmitOpen}
        aria-label="Suggest a programme"
        title="Suggest a programme"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="suggest-btn-label">Contribute</span>
      </button>

      {/* View mode toggle (top right, below Contribute) */}
      <div className="view-toggle-stack">
        <button
          className={`view-toggle-stack-btn ${viewMode === "map" ? "active" : ""}`}
          onClick={() => setViewMode("map")}
          aria-label="Map view"
          title="Map view"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
        </button>
        <button
          className={`view-toggle-stack-btn ${viewMode === "list" ? "active" : ""}`}
          onClick={() => setViewMode("list")}
          aria-label="List view"
          title="List view"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
      </div>

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

      {/* About drawer */}
      <AboutDrawer
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Legal drawer */}
      <LegalDrawer
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
      />

      {/* Footer pill */}
      <div className="footer-pill">
        <span>&copy; {new Date().getFullYear()}</span>
        <span className="footer-pill-separator">·</span>
        <button className="footer-pill-link" onClick={() => { setIsAboutOpen(true); setIsLegalOpen(false); setSelectedProgram(null); setIsSubmitOpen(false); }}>
          About
        </button>
        <span className="footer-pill-separator">·</span>
        <button className="footer-pill-link" onClick={() => { setIsLegalOpen(true); setIsAboutOpen(false); setSelectedProgram(null); setIsSubmitOpen(false); }}>
          Legal
        </button>
      </div>
    </div>
  );
}
