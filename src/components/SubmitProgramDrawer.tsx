"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Program, FilterField, getUniqueOptions } from "@/types/location";

/* ──────────────────────────────────────────────
   Icons
   ────────────────────────────────────────────── */
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/* ──────────────────────────────────────────────
   Tag Input with autocomplete
   ────────────────────────────────────────────── */
interface TagInputProps {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  existingOptions: string[];
}

function TagInput({ label, placeholder, tags, onChange, existingOptions }: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!input || input.length < 1) return [];
    const q = input.toLowerCase();
    return existingOptions
      .filter((opt) => opt.toLowerCase().includes(q) && !tags.includes(opt))
      .slice(0, 6);
  }, [input, existingOptions, tags]);

  useEffect(() => {
    setShowSuggestions(input.length > 0);
    setSelectedIdx(-1);
  }, [input]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIdx >= 0 && suggestions[selectedIdx]) {
        addTag(suggestions[selectedIdx]);
      } else if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div className="submit-field" ref={wrapperRef}>
      <label className="submit-label">{label}</label>
      <div className="submit-tag-input-wrapper">
        {tags.map((tag) => (
          <span key={tag} className="submit-tag">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="submit-tag-x">
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (input.length > 0) setShowSuggestions(true); }}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="submit-tag-text-input"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="submit-tag-suggestions">
          {suggestions.map((s, idx) => (
            <button
              key={s}
              type="button"
              className={`submit-tag-suggestion-item ${idx === selectedIdx ? "selected" : ""}`}
              onClick={() => addTag(s)}
              onMouseEnter={() => setSelectedIdx(idx)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {showSuggestions && suggestions.length === 0 && input.trim() && (
        <div className="submit-tag-suggestions">
          <div className="submit-tag-suggestion-hint">
            Press Enter to add &ldquo;{input.trim()}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */

const LEVEL_OPTIONS = ["Bachelor", "Master", "Postgraduate", "PhD", "Diploma", "Certificate", "Course", "Research Lab"];

interface SubmitProgramDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  programs: Program[];
}

type FormState = "idle" | "submitting" | "success" | "error";

export default function SubmitProgramDrawer({ isOpen, onClose, programs }: SubmitProgramDrawerProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const submitDrawerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollEl = submitDrawerRef.current?.querySelector(".drawer-scroll");
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

  const [formState, setFormState] = useState<FormState>("idle");
  const [submitterName, setSubmitterName] = useState("");
  const [institution, setInstitution] = useState("");
  const [programName, setProgramName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [level, setLevel] = useState("");
  const [discipline, setDiscipline] = useState<string[]>([]);
  const [focus, setFocus] = useState<string[]>([]);
  const [language, setLanguage] = useState("");
  const [duration, setDuration] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  // Get existing tags for autocomplete
  const existingDisciplines = useMemo(
    () => getUniqueOptions(programs, "discipline" as FilterField),
    [programs]
  );
  const existingFocus = useMemo(
    () => getUniqueOptions(programs, "focus" as FilterField),
    [programs]
  );

  function resetForm() {
    setSubmitterName("");
    setInstitution("");
    setProgramName("");
    setCountry("");
    setCity("");
    setLevel("");
    setDiscipline([]);
    setFocus([]);
    setLanguage("");
    setDuration("");
    setUrl("");
    setDescription("");
    setFormState("idle");
  }

  function handleClose() {
    onClose();
    // Reset after animation completes
    setTimeout(resetForm, 300);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("submitting");

    try {
      const formData = {
        access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "",
        subject: `New programme suggestion: ${programName} at ${institution}`,
        from_name: "Sustainability Map",
        "Submitted by": submitterName,
        Institution: institution,
        Program: programName,
        Country: country,
        City: city,
        Level: level,
        Discipline: discipline.join(", "),
        Focus: focus.join(", "),
        Language: language,
        Duration: duration,
        URL: url,
        Description: description,
      };

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        setFormState("success");
      } else {
        setFormState("error");
      }
    } catch {
      setFormState("error");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="submit-drawer-overlay" onClick={handleClose}>
      <div
        ref={submitDrawerRef}
        className="submit-drawer"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined}
      >
        {/* Top bar */}
        <div className="drawer-top-bar">
          <span className="drawer-top-label">Suggest a Programme</span>
          <button className="drawer-close-btn" onClick={handleClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {/* Drag handle (mobile only) */}
        <div className="drawer-drag-handle-row">
          <div className="drawer-drag-handle" />
        </div>

        {/* Content */}
        <div className="drawer-scroll">
          {formState === "success" ? (
            <div className="submit-success">
              <div className="submit-success-icon">
                <CheckIcon />
              </div>
              <h3 className="submit-success-title">Thank you!</h3>
              <p className="submit-success-text">
                Your suggestion has been submitted. We&apos;ll review it and add it to the map soon.
              </p>
              <button type="button" className="submit-btn-secondary" onClick={handleClose}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="submit-intro">
                Know a sustainability programme that&apos;s missing from the map? Let us know and we&apos;ll add it.
              </p>

              {/* Submitter name */}
              <div className="submit-field">
                <label className="submit-label">Your name *</label>
                <input
                  type="text"
                  required
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  className="submit-input"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              {/* Institution */}
              <div className="submit-field">
                <label className="submit-label">Institution *</label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Aalto University"
                  className="submit-input"
                />
              </div>

              {/* Program name */}
              <div className="submit-field">
                <label className="submit-label">Programme name *</label>
                <input
                  type="text"
                  required
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="e.g. Design for Sustainability"
                  className="submit-input"
                />
              </div>

              {/* Country + City row */}
              <div className="submit-row">
                <div className="submit-field">
                  <label className="submit-label">Country *</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Finland"
                    className="submit-input"
                  />
                </div>
                <div className="submit-field">
                  <label className="submit-label">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Helsinki"
                    className="submit-input"
                  />
                </div>
              </div>

              {/* Level + Duration row */}
              <div className="submit-row">
                <div className="submit-field">
                  <label className="submit-label">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className={`submit-select ${!level ? "placeholder" : ""}`}
                  >
                    <option value="" disabled>Select level</option>
                    {LEVEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="submit-field">
                  <label className="submit-label">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 2 years"
                    className="submit-input"
                  />
                </div>
              </div>

              {/* Discipline tags */}
              <TagInput
                label="Discipline"
                placeholder="e.g. Design, Engineering"
                tags={discipline}
                onChange={setDiscipline}
                existingOptions={existingDisciplines}
              />

              {/* Focus tags */}
              <TagInput
                label="Focus"
                placeholder="e.g. Circular Economy"
                tags={focus}
                onChange={setFocus}
                existingOptions={existingFocus}
              />

              {/* Language */}
              <div className="submit-field">
                <label className="submit-label">Language</label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. English"
                  className="submit-input"
                />
              </div>

              {/* URL */}
              <div className="submit-field">
                <label className="submit-label">Programme URL *</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="submit-input"
                />
              </div>

              {/* Description */}
              <div className="submit-field">
                <label className="submit-label">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the programme (optional)"
                  className="submit-textarea"
                  rows={3}
                />
              </div>

              {formState === "error" && (
                <p className="submit-error">
                  Something went wrong. Please try again.
                </p>
              )}

              {/* Submit */}
              <div className="submit-cta-row">
                <button
                  type="submit"
                  disabled={formState === "submitting"}
                  className="submit-btn-primary"
                >
                  {formState === "submitting" ? "Submitting..." : "Submit suggestion"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
