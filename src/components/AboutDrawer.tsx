"use client";

import { useState, useRef, useCallback } from "react";

interface AboutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutDrawer({ isOpen, onClose }: AboutDrawerProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollEl = drawerRef.current?.querySelector(".drawer-scroll");
    if (scrollEl && scrollEl.scrollTop > 0) return;
    dragStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const diff = e.touches[0].clientY - dragStartY.current;
    if (diff > 0) setDragOffset(diff);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragOffset > 100) onClose();
    setDragOffset(0);
    dragStartY.current = null;
  }, [dragOffset, onClose]);

  if (!isOpen) return null;

  return (
    <div className="program-drawer-overlay" onClick={onClose}>
      <div
        ref={drawerRef}
        className="program-drawer"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)`, transition: "none" } : undefined}
      >
        {/* Top bar */}
        <div className="drawer-top-bar">
          <span className="drawer-top-label">About</span>
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
          <h2 className="drawer-program-name">About this Map</h2>

          <p className="about-body">
            This map is a living dataset developed as part of{" "}
            <strong>Resilient Design Pedagogies (RDP)</strong>, a research project funded by the{" "}
            <em>Deutsche Forschungsgemeinschaft</em> (DFG project number 544447906) and hosted at the{" "}
            University of Applied Arts Vienna (Angewandte).
          </p>

          <p className="about-body">
            Principal Investigator: Dr.Ing. Flavia Alice Mameli (Dipl.Des.).
          </p>

          <p className="about-body">
            It documents sustainability-focused design and architecture programmes globally.
          </p>

          <p className="about-body about-body-note">
            Suggestions are reviewed against verified institutional sources before being added.
          </p>
        </div>
      </div>
    </div>
  );
}
