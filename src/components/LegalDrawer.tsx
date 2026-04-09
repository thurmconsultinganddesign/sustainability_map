"use client";

import { useState, useRef, useCallback } from "react";

interface LegalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LegalDrawer({ isOpen, onClose }: LegalDrawerProps) {
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
          <span className="drawer-top-label">Legal</span>
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
          <h2 className="drawer-program-name">Impressum</h2>

          <div className="legal-section">
            <p className="about-body">
              <strong>Dr.Ing. Flavia Alice Mameli (Dipl.Des.)</strong>
            </p>
            <p className="about-body">
              Resilient Design Pedagogies
            </p>
            <p className="about-body">
              Funded by Deutsche Forschungsgemeinschaft
              <br />
              (DFG project number 544447906)
            </p>
          </div>

          <div className="drawer-divider" />

          <div className="legal-section">
            <h3 className="legal-heading">Map Data</h3>
            <p className="about-body">
              Map tiles by{" "}
              <a href="https://stamen.com" target="_blank" rel="noopener noreferrer" className="legal-link">
                Stamen Design
              </a>
              , under{" "}
              <a href="https://creativecommons.org/licenses/by/3.0" target="_blank" rel="noopener noreferrer" className="legal-link">
                CC BY 3.0
              </a>
              . Data by{" "}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="legal-link">
                OpenStreetMap
              </a>
              , under{" "}
              <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener noreferrer" className="legal-link">
                ODbL
              </a>
              . Hosted by{" "}
              <a href="https://stadiamaps.com/" target="_blank" rel="noopener noreferrer" className="legal-link">
                Stadia Maps
              </a>
              .
            </p>
          </div>

          <div className="drawer-divider" />

          <div className="legal-section">
            <h3 className="legal-heading">Privacy</h3>
            <p className="about-body">
              This website does not use cookies or tracking scripts. It is hosted on{" "}
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="legal-link">
                Vercel
              </a>
              , which may collect anonymised access logs (IP address, browser type, timestamps) as part of its infrastructure.
              No personal data is stored or processed beyond what is voluntarily submitted through the contribution form.
            </p>
            <p className="about-body">
              Programme suggestions submitted via the form are sent by email and reviewed manually. Submitted data is used solely for maintaining the map directory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
