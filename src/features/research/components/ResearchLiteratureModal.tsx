import { useState, type FormEvent } from "react";
import {
  lookupLiteratureMetadataByDoi,
  normalizeDoi,
  searchLiteratureMetadataByTitle,
  type LiteratureMetadataResult,
} from "../services/literatureMetadataService";
import { ResearchLargeContentWarning } from "./ResearchLargeContentWarning";
import type {
  ResearchLiteratureSource,
  ResearchLiteratureSourceInput,
  ResearchLiteratureSourceType,
  ResearchLiteratureStatus,
} from "../types";

type ResearchLiteratureModalProps = {
  projectId: string;
  source?: ResearchLiteratureSource;
  onClose: () => void;
  onSaveSource: (source: ResearchLiteratureSourceInput) => void;
};

const sourceTypeLabels: Record<ResearchLiteratureSourceType, string> = {
  article: "Article",
  book: "Book",
  chapter: "Book chapter",
  report: "Report",
  dataset: "Dataset",
  website: "Website",
  other: "Other",
};

const literatureStatusLabels: Record<ResearchLiteratureStatus, string> = {
  unread: "Unread",
  skimmed: "Skimmed",
  read: "Read",
  "notes-taken": "Notes taken",
  cited: "Cited",
  parked: "Parked",
};

function parseThemes(value: string) {
  return value
    .split(",")
    .map((theme) => theme.trim())
    .filter(Boolean);
}

function extractDoi(value?: string) {
  if (!value) {
    return "";
  }

  const explicit = value.match(/(?:doi:\s*|doi\.org\/)(10\.\S+)/i);
  if (explicit?.[1]) {
    return normalizeDoi(explicit[1].replace(/[)\].,;]+$/g, ""));
  }

  const bare = value.match(/\b(10\.\d{4,9}\/[^\s"<>]+)\b/i);
  return bare?.[1] ? normalizeDoi(bare[1].replace(/[)\].,;]+$/g, "")) : "";
}

function metadataLines(metadata: {
  containerTitle?: string;
  doi?: string;
}) {
  return [
    metadata.containerTitle ? `Venue: ${metadata.containerTitle}` : "",
    metadata.doi ? `DOI: ${normalizeDoi(metadata.doi)}` : "",
  ].filter(Boolean);
}

function mergeMetadataNotes(
  currentNotes: string,
  metadata: { containerTitle?: string; doi?: string }
) {
  const existingNotes = currentNotes.trim();
  const existingLower = existingNotes.toLowerCase();
  const additions = metadataLines(metadata).filter((line) => {
    const [label] = line.split(":");
    return !existingLower.includes(`${label.toLowerCase()}:`);
  });

  return [existingNotes, ...additions].filter(Boolean).join("\n");
}

export function ResearchLiteratureModal({
  projectId,
  source,
  onClose,
  onSaveSource,
}: ResearchLiteratureModalProps) {
  const [title, setTitle] = useState(source?.title ?? "");
  const [authors, setAuthors] = useState(source?.authors ?? "");
  const [year, setYear] = useState(source?.year ?? "");
  const [sourceType, setSourceType] = useState<ResearchLiteratureSourceType>(
    source?.sourceType ?? "article"
  );
  const [status, setStatus] = useState<ResearchLiteratureStatus>(
    source?.status ?? "unread"
  );
  const [link, setLink] = useState(source?.link ?? "");
  const [themes, setThemes] = useState(source?.themes.join(", ") ?? "");
  const [keyQuote, setKeyQuote] = useState(source?.keyQuote ?? "");
  const [notes, setNotes] = useState(source?.notes ?? "");
  const [pinned, setPinned] = useState(source?.pinned ?? false);
  const [doi, setDoi] = useState(
    extractDoi(source?.notes) || extractDoi(source?.link)
  );
  const [titleSearch, setTitleSearch] = useState(source?.title ?? "");
  const [lookupStatus, setLookupStatus] = useState<
    "idle" | "loading" | "success" | "not-found" | "error"
  >("idle");

  function applyMetadata(metadata: LiteratureMetadataResult) {
    if (metadata.title) {
      setTitle(metadata.title);
      setTitleSearch(metadata.title);
    }

    if (metadata.authors) {
      setAuthors(metadata.authors);
    }

    if (metadata.year) {
      setYear(metadata.year);
    }

    setSourceType(metadata.sourceType);

    if (metadata.doi) {
      setDoi(metadata.doi);
    }

    if (metadata.url || metadata.doi) {
      setLink(
        metadata.url ??
          (metadata.doi ? `https://doi.org/${normalizeDoi(metadata.doi)}` : "")
      );
    }

    setNotes((currentNotes) =>
      mergeMetadataNotes(currentNotes, {
        containerTitle: metadata.containerTitle,
        doi: metadata.doi,
      })
    );
  }

  async function handleDoiLookup() {
    const cleanedDoi = normalizeDoi(doi);

    if (!cleanedDoi) {
      setLookupStatus("not-found");
      return;
    }

    setLookupStatus("loading");

    try {
      const metadata = await lookupLiteratureMetadataByDoi(cleanedDoi);

      if (!metadata) {
        setLookupStatus("not-found");
        return;
      }

      applyMetadata(metadata);
      setLookupStatus("success");
    } catch {
      setLookupStatus("error");
    }
  }

  async function handleTitleLookup() {
    if (!titleSearch.trim()) {
      setLookupStatus("not-found");
      return;
    }

    setLookupStatus("loading");

    try {
      const metadata = await searchLiteratureMetadataByTitle(titleSearch);

      if (!metadata) {
        setLookupStatus("not-found");
        return;
      }

      applyMetadata(metadata);
      setLookupStatus("success");
    } catch {
      setLookupStatus("error");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      return;
    }

    onSaveSource({
      projectId,
      title: cleanedTitle,
      authors,
      year,
      sourceType,
      status,
      link: link || (doi.trim() ? `https://doi.org/${normalizeDoi(doi)}` : ""),
      themes: parseThemes(themes),
      keyQuote,
      notes: mergeMetadataNotes(notes, { doi }),
      pinned,
    });

    onClose();
  }

  return (
    <div className="research-modal-backdrop" role="presentation">
      <div
        className="research-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="research-literature-modal-title"
      >
        <div className="research-modal__header">
          <div>
            <p className="eyebrow">
              {source ? "Edit source" : "New source"}
            </p>
            <h2 id="research-literature-modal-title">
              {source ? "Update this source." : "Add a source to the project."}
            </h2>
            <p>
              Keep this lightweight: title, status, themes, useful notes, and
              one quote if it matters.
            </p>
          </div>

          <button
            className="research-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close literature modal"
          >
            ×
          </button>
        </div>

        <form className="research-modal__form" onSubmit={handleSubmit}>
          <section className="research-metadata-lookup">
            <div>
              <p className="research-metadata-lookup__eyebrow">
                Metadata lookup
              </p>
              <p>
                Use DOI or title to prefill the source, then review everything
                before saving.
              </p>
            </div>

            <div className="research-modal__row">
              <label>
                <span>DOI</span>
                <input
                  value={doi}
                  onChange={(event) => setDoi(event.target.value)}
                  placeholder="10.1177/000312242..."
                />
              </label>

              <button
                className="research-secondary-button"
                type="button"
                disabled={lookupStatus === "loading"}
                onClick={handleDoiLookup}
              >
                Lookup DOI
              </button>
            </div>

            <div className="research-modal__row">
              <label>
                <span>Title search</span>
                <input
                  value={titleSearch}
                  onChange={(event) => setTitleSearch(event.target.value)}
                  placeholder="Paste the article or book title"
                />
              </label>

              <button
                className="research-secondary-button"
                type="button"
                disabled={lookupStatus === "loading"}
                onClick={handleTitleLookup}
              >
                Search by title
              </button>
            </div>

            {lookupStatus !== "idle" ? (
              <p
                className={`research-metadata-lookup__status research-metadata-lookup__status--${lookupStatus}`}
              >
                {lookupStatus === "loading"
                  ? "Looking up..."
                  : lookupStatus === "success"
                    ? "Metadata found. Review the filled fields before saving."
                    : lookupStatus === "not-found"
                      ? "No result found."
                      : "Lookup failed; enter manually."}
              </p>
            ) : null}
          </section>

          <label>
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Article, book, report, dataset..."
              autoFocus
            />
          </label>

          <div className="research-modal__row">
            <label>
              <span>Authors</span>
              <input
                value={authors}
                onChange={(event) => setAuthors(event.target.value)}
                placeholder="Pridemore, Rogers, McCall..."
              />
            </label>

            <label>
              <span>Year</span>
              <input
                value={year}
                onChange={(event) => setYear(event.target.value)}
                placeholder="2025"
              />
            </label>
          </div>

          <div className="research-modal__row">
            <label>
              <span>Type</span>
              <select
                value={sourceType}
                onChange={(event) =>
                  setSourceType(event.target.value as ResearchLiteratureSourceType)
                }
              >
                {Object.entries(sourceTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ResearchLiteratureStatus)
                }
              >
                {Object.entries(literatureStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>Link, optional</span>
            <input
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="Google Doc, DOI, library link, PDF link..."
            />
          </label>

          <label>
            <span>Themes, comma-separated</span>
            <input
              value={themes}
              onChange={(event) => setThemes(event.target.value)}
              placeholder="state capacity, inequality, homicide, methods"
            />
          </label>

          <label className="research-checkbox-label">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
            />
            <span>Pin this source</span>
          </label>

          <label>
            <span>Key quote</span>
            <textarea
              value={keyQuote}
              onChange={(event) => setKeyQuote(event.target.value)}
              placeholder="One quote worth keeping close..."
              rows={3}
            />
          </label>

          <label>
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Why this matters, where it belongs, what it supports..."
              rows={5}
            />
          </label>

          <ResearchLargeContentWarning
            fields={[
              { label: "key quote", value: keyQuote },
              { label: "source notes", value: notes },
            ]}
          />

          <div className="research-modal__actions">
            <button
              className="research-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button className="research-primary-button" type="submit">
              {source ? "Save source" : "Add source"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
