"use client";

import { Program } from "@/types/location";

interface ProgrammeListProps {
  programs: Program[];
  onProgramSelect: (program: Program) => void;
  selectedProgram?: Program | null;
}

export default function ProgrammeList({
  programs,
  onProgramSelect,
  selectedProgram = null,
}: ProgrammeListProps) {
  const selectedKey = selectedProgram
    ? `${selectedProgram.institution}-${selectedProgram.program}`
    : null;

  if (programs.length === 0) {
    return (
      <div className="programme-list-empty">
        <p>No programmes match your filters.</p>
      </div>
    );
  }

  return (
    <div className="programme-list">
      {programs.map((program, index) => {
        const key = `${program.institution}-${program.program}`;
        const isSelected = key === selectedKey;

        // Build meta tags
        const meta: string[] = [];
        if (program.level) meta.push(program.level);
        if (program.discipline) meta.push(program.discipline);

        return (
          <button
            key={`${key}-${index}`}
            className={`programme-list-item ${isSelected ? "selected" : ""}`}
            onClick={() => onProgramSelect(program)}
          >
            <div className="programme-list-item-main">
              <span className="programme-list-item-name">{program.program}</span>
              <span className="programme-list-item-institution">
                {program.institution} · {program.city}, {program.country}
              </span>
            </div>
            {meta.length > 0 && (
              <div className="programme-list-item-meta">
                {meta.map((tag) => (
                  <span key={tag} className="programme-list-item-tag">{tag}</span>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
