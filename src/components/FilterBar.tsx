"use client";

import { Program, FilterField, FILTER_FIELDS } from "@/types/location";

interface FilterBarProps {
  programs: Program[];
  filters: Record<FilterField, string | null>;
  onFilterChange: (field: FilterField, value: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount: number;
}

export default function FilterBar({
  programs,
  filters,
  onFilterChange,
  searchQuery,
  onSearchChange,
  resultCount,
}: FilterBarProps) {
  /** Get unique values for a given filter field, sorted */
  function getOptions(field: FilterField): string[] {
    const values = Array.from(new Set(programs.map((p) => p[field]).filter(Boolean)));
    return values.sort();
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Top row: search + result count */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search programs, institutions, cities..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <svg
            className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {resultCount} program{resultCount !== 1 ? "s" : ""}
        </span>
        {activeFilterCount > 0 && (
          <button
            onClick={() =>
              FILTER_FIELDS.forEach((f) => onFilterChange(f.key, null))
            }
            className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-2">
        {FILTER_FIELDS.map(({ key, label }) => {
          const options = getOptions(key);
          const isActive = filters[key] !== null;

          return (
            <select
              key={key}
              value={filters[key] || ""}
              onChange={(e) =>
                onFilterChange(key, e.target.value || null)
              }
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                isActive
                  ? "bg-green-50 border-green-300 text-green-800 font-medium"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <option value="">{label}</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          );
        })}
      </div>
    </div>
  );
}
