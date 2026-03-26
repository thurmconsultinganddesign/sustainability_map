"use client";

import { useState, useRef, useCallback } from "react";
import { Program } from "@/types/location";

interface ProgramDrawerProps {
  program: Program | null;
  onClose: () => void;
}

export default function ProgramDrawer({ program, onClose }: ProgramDrawerProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only enable swipe when scrollable content is at the top
    const scrollEl = drawerRef.current?.querySelector(".drawer-scroll");
    if (scrollEl && scrollEl.scrollTop > 0) return;
    dragStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const diff = e.touches[0].clientY - dragStartY.current;
    if (diff > 0) {
      setDragOffset(diff);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragOffset > 100) {
      onClose();
    }
    setDragOffset(0);
    dragStartY.current = null;
  }, [dragOffset, onClose]);

  if (!program) return null;

  return (
    <div className={`program-drawer-overlay`} onClick={onClose}>
      {/* Desktop: right side drawer */}
      <div
        ref={drawerRef}
        className="program-drawer"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined}
      >
        {/* Top bar */}
        <div className="drawer-top-bar">
          <span className="drawer-top-label">Program Details</span>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drag handle (mobile only) */}
        <div className="drawer-drag-handle-row">
          <div className="drawer-drag-handle" />
        </div>

        {/* Scrollable content */}
        <div className="drawer-scroll">
          <h2 className="drawer-program-name">{program.program}</h2>
          <p className="drawer-institution-line">
            {program.institution} · {program.city}, {program.country}
          </p>

          <div className="drawer-info-grid">
            <div className="drawer-info-cell">
              <label>Level</label>
              <span>{program.level}</span>
            </div>
            <div className="drawer-info-cell">
              <label>Duration</label>
              <span>{program.duration}</span>
            </div>
            <div className="drawer-info-cell">
              <label>Discipline</label>
              <span>{program.discipline}</span>
            </div>
            <div className="drawer-info-cell">
              <label>Language</label>
              <span>{program.language}</span>
            </div>
            {program.focus && (
              <div className="drawer-info-cell drawer-info-cell-wide">
                <label>Focus</label>
                <span>{program.focus}</span>
              </div>
            )}
          </div>

          {program.description && (
            <>
              <div className="drawer-divider" />
              <p className="drawer-description">{program.description}</p>
            </>
          )}
        </div>

        {/* Pinned CTA */}
        <div className="drawer-cta-row">
          {program.url ? (
            <a
              href={program.url}
              target="_blank"
              rel="noopener noreferrer"
              className="drawer-cta-primary"
            >
              Visit program
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </a>
          ) : (
            <span className="drawer-cta-primary drawer-cta-disabled">No link available</span>
          )}
        </div>
      </div>
    </div>
  );
}
