"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Program,
  FilterField,
  FILTER_FIELDS,
  getUniqueOptions,
  fieldMatchesMulti,
} from "@/types/location";

/* ──────────────────────────────────────────────
   Icons (inline SVGs to avoid dependencies)
   ────────────────────────────────────────────── */
function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function FilterIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="8" cy="6" r="2" fill="currentColor" />
      <circle cx="16" cy="12" r="2" fill="currentColor" />
      <circle cx="10" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */

/** Top hint categories shown inline on desktop */
const HINT_FIELDS = FILTER_FIELDS.slice(0, 2); // Country, City
const REMAINING_COUNT = FILTER_FIELDS.length - HINT_FIELDS.length;

const MAX_SUGGESTIONS = 6;

export type ViewMode = "map" | "list";

interface SearchFilterBarProps {
  programs: Program[];
  filters: Record<FilterField, string[]>;
  onFiltersApply: (filters: Record<FilterField, string[]>) => void;
  onFilterRemove: (field: FilterField, value: string) => void;
  onFiltersClearAll: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount: number;
  onProgramSelect?: (program: Program) => void;
  onFiltersOpen?: () => void;
  isListMode?: boolean;
}

export default function SearchFilterBar({
  programs,
  filters,
  onFiltersApply,
  onFilterRemove,
  onFiltersClearAll,
  searchQuery,
  onSearchChange,
  resultCount,
  onProgramSelect,
  onFiltersOpen,
  isListMode = false,
}: SearchFilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [openField, setOpenField] = useState<FilterField | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Staged filter selections (local to panel, applied on "Apply")
  const [staged, setStaged] = useState<Record<FilterField, string[]>>(filters);

  // Sync staged filters when panel opens or applied filters change externally
  useEffect(() => {
    setStaged(filters);
    setOpenField(null);
  }, [filters, isOpen]);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current && panelRef.current.contains(target)) return;
      if (barRef.current && barRef.current.contains(target)) return;
      if (suggestionsRef.current && suggestionsRef.current.contains(target)) return;
      setIsOpen(false);
      setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Flat list of all active filter chips: [field, value]
  const activeChips: [FilterField, string][] = [];
  for (const { key } of FILTER_FIELDS) {
    for (const val of filters[key]) {
      activeChips.push([key, val]);
    }
  }
  const activeCount = activeChips.length;

  // Count staged selections that differ from applied
  const stagedCount = FILTER_FIELDS.reduce((n, { key }) => n + staged[key].length, 0);
  const hasStagedChanges = JSON.stringify(staged) !== JSON.stringify(filters);

  /** Compute search suggestions — matching programs, respecting active filters */
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const q = searchQuery.toLowerCase();
    return programs
      .filter((p) => {
        for (const [field, values] of Object.entries(filters)) {
          if ((values as string[]).length > 0 && !fieldMatchesMulti(p, field as FilterField, values as string[]))
            return false;
        }
        const searchable = [
          p.institution, p.program, p.country, p.city,
          p.level, p.discipline, p.focus, p.language,
        ].join(" ").toLowerCase();
        return searchable.includes(q);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [programs, searchQuery, filters]);

  // Show suggestions when there's a query and matches
  useEffect(() => {
    setShowSuggestions(suggestions.length > 0 && searchQuery.length >= 2);
    setSelectedIndex(-1);
  }, [suggestions, searchQuery]);

  function toggleStaged(field: FilterField, value: string) {
    setStaged((prev) => {
      const arr = prev[field];
      const next = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, [field]: next };
    });
  }

  function clearStaged() {
    const empty: Record<FilterField, string[]> = {} as Record<FilterField, string[]>;
    FILTER_FIELDS.forEach(({ key }) => { empty[key] = []; });
    setStaged(empty);
  }

  function applyFilters() {
    onFiltersApply(staged);
    setIsOpen(false);
  }

  function openWithFocus(_field?: FilterField) {
    setIsOpen(true);
    setShowSuggestions(false);
    onFiltersOpen?.();
  }

  function handleSelectProgram(program: Program) {
    setShowSuggestions(false);
    onProgramSelect?.(program);
  }

  function handleSearchChange(value: string) {
    onSearchChange(value);
    if (!value) setShowSuggestions(false);
  }

  /** Keyboard navigation for suggestions */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && selectedIndex >= 0) {
        handleSelectProgram(suggestions[selectedIndex]);
      } else {
        setShowSuggestions(false);
        (e.target as HTMLInputElement).blur();
      }
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  /** Highlight matching text in a string */
  function highlightMatch(text: string) {
    if (!searchQuery) return text;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong className="search-highlight">{text.slice(idx, idx + searchQuery.length)}</strong>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  }

  return (
    <div className={`search-filter-wrapper ${isListMode ? "list-mode" : ""}`}>
      {/* ─── Collapsed pill ─── */}
      {!isOpen && (
        <div ref={barRef} className="search-pill">
          <SearchIcon className="search-pill-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search programmes..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchQuery.length >= 2 && suggestions.length > 0)
                setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            className="search-pill-input"
          />

          {/* Divider + inline category hints (desktop only) */}
          <div className="search-pill-hints">
            <span className="search-pill-divider">|</span>
            {HINT_FIELDS.map(({ key, label }) => (
              <button key={key} onClick={() => openWithFocus(key)} className="search-pill-hint">
                {label}
              </button>
            ))}
            <button onClick={() => openWithFocus()} className="search-pill-hint">
              +{REMAINING_COUNT} more
            </button>
          </div>

          {/* Mobile: single filter button */}
          <button
            onClick={() => openWithFocus()}
            className="search-pill-filter-btn-mobile"
            aria-label="Open filters"
          >
            <FilterIcon />
            {activeCount > 0 && (
              <span className="filter-badge">{activeCount}</span>
            )}
          </button>
        </div>
      )}

      {/* ─── Search suggestions dropdown ─── */}
      {!isOpen && showSuggestions && (
        <div ref={suggestionsRef} className="search-suggestions">
          {suggestions.map((program, idx) => (
            <button
              key={`${program.institution}-${program.program}`}
              className={`search-suggestion-item ${idx === selectedIndex ? "selected" : ""}`}
              onClick={() => handleSelectProgram(program)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className="search-suggestion-icon">
                <LocationIcon />
              </div>
              <div className="search-suggestion-text">
                <span className="search-suggestion-name">{highlightMatch(program.program)}</span>
                <span className="search-suggestion-meta">
                  {program.institution} · {program.city}, {program.country}
                </span>
              </div>
            </button>
          ))}
          <div className="search-suggestion-footer">
            {resultCount} result{resultCount !== 1 ? "s" : ""} on map
          </div>
        </div>
      )}

      {/* ─── Expanded filter panel ─── */}
      {isOpen && (
        <div ref={panelRef} className="filter-panel">
          {/* Top row: search + close */}
          <div className="filter-panel-header">
            <SearchIcon className="search-pill-icon" />
            <input
              type="text"
              placeholder="Search programmes..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-pill-input"
            />
            <button onClick={() => setIsOpen(false)} className="filter-panel-close" aria-label="Close filters">
              <CloseIcon />
            </button>
          </div>

          {/* Filter dropdown pills */}
          <div className="filter-panel-body">
            <div className="filter-pills-row">
              {FILTER_FIELDS.map(({ key, label }) => {
                const count = staged[key].length;
                const isFieldOpen = openField === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`filter-pill ${count > 0 ? "has-selections" : ""} ${isFieldOpen ? "open" : ""}`}
                    onClick={() => setOpenField(isFieldOpen ? null : key)}
                  >
                    {label}{count > 0 && <span className="filter-pill-count">{count}</span>}
                    <svg className={`filter-pill-chevron ${isFieldOpen ? "open" : ""}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                );
              })}
            </div>

            {/* Expanded checkbox dropdown for the open field */}
            {openField && (
              <div className="filter-dropdown">
                {getUniqueOptions(programs, openField).map((opt) => {
                  const isChecked = staged[openField].includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={`filter-checkbox-row ${isChecked ? "checked" : ""}`}
                      onClick={() => toggleStaged(openField, opt)}
                    >
                      <span className={`filter-checkbox ${isChecked ? "checked" : ""}`}>
                        {isChecked && <CheckIcon />}
                      </span>
                      <span className="filter-checkbox-label">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Staged chips preview */}
            {stagedCount > 0 && (
              <div className="filter-staged-chips">
                {FILTER_FIELDS.map(({ key }) =>
                  staged[key].map((val) => (
                    <span key={`${key}-${val}`} className="filter-chip">
                      {val}
                      <button
                        onClick={() => toggleStaged(key, val)}
                        className="filter-chip-x"
                        aria-label={`Remove ${val}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>
            )}

            {/* Apply / Clear footer */}
            <div className="filter-panel-actions">
              {(stagedCount > 0 || activeCount > 0) && (
                <button
                  onClick={() => { clearStaged(); onFiltersClearAll(); setIsOpen(false); }}
                  className="filter-action-clear"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={applyFilters}
                className={`filter-action-apply ${hasStagedChanges ? "" : "disabled"}`}
                disabled={!hasStagedChanges}
              >
                Apply{stagedCount > 0 ? ` (${stagedCount})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Active filter chips (always visible below the bar when collapsed) ─── */}
      {!isOpen && activeCount > 0 && !showSuggestions && (
        <div className="filter-chips-strip">
          {activeChips.map(([field, value]) => (
            <span key={`${field}-${value}`} className="filter-chip">
              {value}
              <button
                onClick={() => onFilterRemove(field, value)}
                className="filter-chip-x"
                aria-label={`Remove ${value} filter`}
              >
                ✕
              </button>
            </span>
          ))}
          <button onClick={onFiltersClearAll} className="filter-clear-link">
            Clear all
          </button>
        </div>
      )}

      {/* ─── Result count (below everything) ─── */}
      {!isOpen && !showSuggestions && (
        <div className="search-result-count">
          {resultCount} programme{resultCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
