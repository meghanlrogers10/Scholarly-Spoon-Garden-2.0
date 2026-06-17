import { useRef, useState, type ChangeEvent } from "react";
import type {
  ResearchLiteratureSource,
  ResearchLiteratureSourceInput,
  ResearchLiteratureSourceType,
  ResearchLiteratureStatus,
  ResearchPrismaRecord,
} from "../../types";
import {
  prepareReferenceImport,
  type ReferenceImportCandidate,
  type ReferenceImportFormat,
} from "./literatureReferenceImport";

type SourceTypeFilter = "all" | ResearchLiteratureSourceType;
type StatusFilter = "all" | ResearchLiteratureStatus;

type LiteratureReadingQueuePanelProps = {
  projectId: string;
  sources: ResearchLiteratureSource[];
  filteredSources: ResearchLiteratureSource[];
  prismaRecords: ResearchPrismaRecord[];
  searchTerm: string;
  statusFilter: StatusFilter;
  sourceTypeFilter: SourceTypeFilter;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onSourceTypeFilterChange: (value: SourceTypeFilter) => void;
  onResetFilters: () => void;
  onTogglePinnedSource: (sourceId: string) => void;
  onEditSource: (source: ResearchLiteratureSource) => void;
  onDeleteSource: (sourceId: string) => void;
  onViewThemeSources: (theme: string) => void;
  onSendSourceToMindMap: (source: ResearchLiteratureSource) => void;
  onImportReferenceSources: (
    sources: ResearchLiteratureSourceInput[],
    skippedDuplicateCount: number,
    failedParseCount: number
  ) => void;
};

type ReferenceImportReview = {
  format: ReferenceImportFormat;
  fileName: string;
  candidates: ReferenceImportCandidate[];
  failedCount: number;
  selectedIds: Set<string>;
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

const prismaStatusLabels = {
  identified: "Identified",
  screened: "Screened",
  eligible: "Eligible",
  included: "Included",
  excluded: "Excluded",
};

function normalizeLink(value: string) {
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return `https://${value}`;
  }

  return value;
}

function getSourceThemes(source: ResearchLiteratureSource) {
  return Array.isArray(source.themes) ? source.themes : [];
}

export function LiteratureReadingQueuePanel({
  projectId,
  sources,
  filteredSources,
  prismaRecords,
  searchTerm,
  statusFilter,
  sourceTypeFilter,
  onSearchTermChange,
  onStatusFilterChange,
  onSourceTypeFilterChange,
  onResetFilters,
  onTogglePinnedSource,
  onEditSource,
  onDeleteSource,
  onViewThemeSources,
  onSendSourceToMindMap,
  onImportReferenceSources,
}: LiteratureReadingQueuePanelProps) {
  const bibInputRef = useRef<HTMLInputElement | null>(null);
  const risInputRef = useRef<HTMLInputElement | null>(null);
  const [referenceImportReview, setReferenceImportReview] =
    useState<ReferenceImportReview | null>(null);
  const [referenceImportError, setReferenceImportError] = useState("");

  async function handleReferenceFileChange(
    event: ChangeEvent<HTMLInputElement>,
    format: ReferenceImportFormat
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const { candidates, failedCount } = prepareReferenceImport({
        text,
        format,
        projectId,
        existingSources: sources,
      });
      const selectedIds = new Set(
        candidates
          .filter((candidate) => !candidate.duplicate)
          .map((candidate) => candidate.id)
      );

      setReferenceImportReview({
        format,
        fileName: file.name,
        candidates,
        failedCount,
        selectedIds,
      });
      setReferenceImportError("");
    } catch (error) {
      setReferenceImportReview(null);
      setReferenceImportError(
        error instanceof Error
          ? error.message
          : "Could not parse this reference file."
      );
    }
  }

  function toggleImportCandidate(candidateId: string) {
    setReferenceImportReview((currentReview) => {
      if (!currentReview) {
        return currentReview;
      }

      const selectedIds = new Set(currentReview.selectedIds);

      if (selectedIds.has(candidateId)) {
        selectedIds.delete(candidateId);
      } else {
        selectedIds.add(candidateId);
      }

      return {
        ...currentReview,
        selectedIds,
      };
    });
  }

  function confirmReferenceImport() {
    if (!referenceImportReview) {
      return;
    }

    const selectedSources = referenceImportReview.candidates
      .filter(
        (candidate) =>
          !candidate.duplicate &&
          referenceImportReview.selectedIds.has(candidate.id)
      )
      .map((candidate) => candidate.source);
    const duplicateCount = referenceImportReview.candidates.filter(
      (candidate) => candidate.duplicate
    ).length;

    onImportReferenceSources(
      selectedSources,
      duplicateCount,
      referenceImportReview.failedCount
    );
    setReferenceImportReview(null);
  }

  const selectedImportCount = referenceImportReview
    ? referenceImportReview.candidates.filter(
        (candidate) =>
          !candidate.duplicate &&
          referenceImportReview.selectedIds.has(candidate.id)
      ).length
    : 0;
  const duplicateImportCount = referenceImportReview
    ? referenceImportReview.candidates.filter((candidate) => candidate.duplicate)
        .length
    : 0;
  const prismaBySourceId = new Map(
    prismaRecords
      .filter((record) => record.sourceId)
      .map((record) => [record.sourceId, record])
  );

  return (
    <section className="literature-panel">
      <div className="literature-panel__header">
        <div>
          <p className="literature-panel__eyebrow">Reading queue</p>
          <h2>Sources</h2>
          <p>
            Track what needs reading, what has notes, and what is already doing
            work in the manuscript.
          </p>
        </div>

        <div className="literature-reference-import-actions">
          <button
            className="research-secondary-button"
            type="button"
            onClick={() => bibInputRef.current?.click()}
          >
            Import BibTeX
          </button>

          <button
            className="research-secondary-button"
            type="button"
            onClick={() => risInputRef.current?.click()}
          >
            Import RIS
          </button>

          <input
            ref={bibInputRef}
            type="file"
            accept=".bib,.bibtex,application/x-bibtex,text/plain"
            onChange={(event) => handleReferenceFileChange(event, "bibtex")}
          />

          <input
            ref={risInputRef}
            type="file"
            accept=".ris,application/x-research-info-systems,text/plain"
            onChange={(event) => handleReferenceFileChange(event, "ris")}
          />
        </div>
      </div>

      {referenceImportError ? (
        <div className="research-workspace-message research-workspace-message--error">
          {referenceImportError}
        </div>
      ) : null}

      {referenceImportReview ? (
        <section className="literature-reference-import-review">
          <div className="literature-reference-import-review__header">
            <div>
              <p className="literature-panel__eyebrow">
                {referenceImportReview.format === "bibtex" ? "BibTeX" : "RIS"}{" "}
                import preview
              </p>
              <h3>{referenceImportReview.fileName}</h3>
              <p>
                {referenceImportReview.candidates.length} records parsed.{" "}
                {duplicateImportCount} possible duplicates.{" "}
                {referenceImportReview.failedCount} records could not be parsed.
              </p>
            </div>

            <div className="literature-reference-import-review__actions">
              <button
                className="research-secondary-button"
                type="button"
                onClick={() => setReferenceImportReview(null)}
              >
                Cancel
              </button>

              <button
                className="research-primary-button"
                type="button"
                disabled={selectedImportCount === 0}
                onClick={confirmReferenceImport}
              >
                Import {selectedImportCount} selected
              </button>
            </div>
          </div>

          {referenceImportReview.candidates.length > 0 ? (
            <div className="literature-reference-import-list">
              {referenceImportReview.candidates.map((candidate) => (
                <label
                  key={candidate.id}
                  className={`literature-reference-import-candidate${
                    candidate.duplicate ? " is-duplicate" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={referenceImportReview.selectedIds.has(candidate.id)}
                    disabled={candidate.duplicate}
                    onChange={() => toggleImportCandidate(candidate.id)}
                  />

                  <span>
                    <strong>{candidate.source.title}</strong>
                    <small>
                      {[
                        candidate.source.authors,
                        candidate.source.year,
                        candidate.venue,
                        candidate.doi ? `DOI: ${candidate.doi}` : "",
                        candidate.duplicateReason,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No citation details parsed"}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="research-empty-state">
              No importable references were found in this file.
            </div>
          )}
        </section>
      ) : null}

      <div className="literature-filter-panel">
        <label>
          <span>Search</span>
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search title, author, theme, quote, notes..."
          />
        </label>

        <label>
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as StatusFilter)
            }
          >
            <option value="all">All statuses</option>
            {Object.entries(literatureStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Type</span>
          <select
            value={sourceTypeFilter}
            onChange={(event) =>
              onSourceTypeFilterChange(event.target.value as SourceTypeFilter)
            }
          >
            <option value="all">All types</option>
            {Object.entries(sourceTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <button
          className="research-chip-button"
          type="button"
          onClick={onResetFilters}
        >
          Reset
        </button>
      </div>

      <section className="research-literature-list">
        {filteredSources.map((source) => (
          <article
            key={source.id}
            className={`research-literature-card research-literature-card--${source.status}`}
          >
            <div className="research-literature-card__header">
              <div>
                <p className="research-literature-card__eyebrow">
                  {source.pinned ? "Pinned · " : ""}
                  {sourceTypeLabels[source.sourceType]} ·{" "}
                  {literatureStatusLabels[source.status]}
                </p>

                <h2>{source.title}</h2>

                <p className="research-literature-card__citation">
                  {[source.authors, source.year].filter(Boolean).join(" · ") ||
                    "No citation details yet"}
                </p>
              </div>

              <button
                className="research-chip-button"
                type="button"
                onClick={() => onTogglePinnedSource(source.id)}
              >
                {source.pinned ? "Unpin" : "Pin"}
              </button>
            </div>

            <div className="research-literature-card__meta">
              {prismaBySourceId.get(source.id) ? (
                <span>
                  PRISMA:{" "}
                  {prismaStatusLabels[prismaBySourceId.get(source.id)!.status]}
                </span>
              ) : null}

              {source.link ? (
                <a
                  href={normalizeLink(source.link)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open link
                </a>
              ) : (
                <span>No link yet</span>
              )}

              {getSourceThemes(source).length > 0 ? (
                getSourceThemes(source).map((theme) => (
                  <button
                    key={theme}
                    className="literature-chip-button"
                    type="button"
                    onClick={() => onViewThemeSources(theme)}
                  >
                    {theme}
                  </button>
                ))
              ) : (
                <span>No themes yet</span>
              )}
            </div>

            {source.keyQuote ? (
              <blockquote className="research-literature-card__quote">
                {source.keyQuote}
              </blockquote>
            ) : null}

            {source.notes ? (
              <p className="research-literature-card__notes">{source.notes}</p>
            ) : null}

            <div className="research-project-card__actions">
              <button
                className="research-chip-button"
                type="button"
                onClick={() => onSendSourceToMindMap(source)}
              >
                Send to Mind Map
              </button>

              <button
                className="research-chip-button"
                type="button"
                onClick={() => onEditSource(source)}
              >
                Edit
              </button>

              <button
                className="research-chip-button research-chip-button--danger"
                type="button"
                onClick={() => onDeleteSource(source.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}

        {sources.length === 0 ? (
          <div className="research-empty-state">
            No sources tracked yet. Add the first source so this project has a
            working literature map.
          </div>
        ) : null}

        {sources.length > 0 && filteredSources.length === 0 ? (
          <div className="research-empty-state">
            No sources match these filters.
          </div>
        ) : null}
      </section>
    </section>
  );
}
