import { useState, type FormEvent } from "react";
import type {
  ResearchLiteratureSource,
  ResearchPrismaCriteria,
  ResearchPrismaRecord,
  ResearchPrismaRecordInput,
  ResearchPrismaStatus,
} from "../../types";
import { prismaStatusLabels } from "./literaturePrismaLabels";

type PrismaStatusFilter = "all" | ResearchPrismaStatus;

type LiteraturePrismaPanelProps = {
  projectId: string;
  sources: ResearchLiteratureSource[];
  records: ResearchPrismaRecord[];
  criteria: ResearchPrismaCriteria;
  onCreateRecord: (input: ResearchPrismaRecordInput) => void;
  onUpdateRecord: (recordId: string, input: ResearchPrismaRecordInput) => void;
  onDeleteRecord: (recordId: string) => void;
  onSaveCriteria: (
    projectId: string,
    inclusionCriteria: string[],
    exclusionCriteria: string[]
  ) => void;
};

function parseCriteria(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getInitialForm(projectId: string): ResearchPrismaRecordInput {
  return {
    projectId,
    sourceId: "",
    sourceTitle: "",
    status: "identified",
    exclusionReason: "",
    inclusionNotes: "",
    screeningNotes: "",
    database: "",
    sourceOrigin: "",
    searchString: "",
    importedAt: "",
    screenedAt: "",
  };
}

function recordMatchesSearch(record: ResearchPrismaRecord, query: string) {
  if (!query.trim()) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();

  return [
    record.sourceTitle,
    record.status,
    record.exclusionReason,
    record.inclusionNotes,
    record.screeningNotes,
    record.database,
    record.sourceOrigin,
    record.searchString,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

export function LiteraturePrismaPanel({
  projectId,
  sources,
  records,
  criteria,
  onCreateRecord,
  onUpdateRecord,
  onDeleteRecord,
  onSaveCriteria,
}: LiteraturePrismaPanelProps) {
  const [statusFilter, setStatusFilter] = useState<PrismaStatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [form, setForm] = useState<ResearchPrismaRecordInput>(
    getInitialForm(projectId)
  );
  const [inclusionCriteria, setInclusionCriteria] = useState(
    criteria.inclusionCriteria.join("\n")
  );
  const [exclusionCriteria, setExclusionCriteria] = useState(
    criteria.exclusionCriteria.join("\n")
  );

  const counts = (Object.keys(prismaStatusLabels) as ResearchPrismaStatus[]).reduce(
    (summary, status) => ({
      ...summary,
      [status]: records.filter((record) => record.status === status).length,
    }),
    {} as Record<ResearchPrismaStatus, number>
  );
  const exclusionReasonCounts = records
    .filter((record) => record.status === "excluded" && record.exclusionReason)
    .reduce<Record<string, number>>((summary, record) => {
      const reason = record.exclusionReason ?? "Unspecified";
      summary[reason] = (summary[reason] ?? 0) + 1;
      return summary;
    }, {});
  const filteredRecords = records.filter((record) => {
    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;

    return matchesStatus && recordMatchesSearch(record, searchTerm);
  });

  function updateForm(updates: Partial<ResearchPrismaRecordInput>) {
    setForm((currentForm) => ({
      ...currentForm,
      ...updates,
    }));
  }

  function handleSourceChange(sourceId: string) {
    const selectedSource = sources.find((source) => source.id === sourceId);

    updateForm({
      sourceId,
      sourceTitle: selectedSource?.title ?? form.sourceTitle,
    });
  }

  function resetForm() {
    setEditingRecordId(null);
    setForm(getInitialForm(projectId));
  }

  function editRecord(record: ResearchPrismaRecord) {
    setEditingRecordId(record.id);
    setForm({
      projectId,
      sourceId: record.sourceId ?? "",
      sourceTitle: record.sourceTitle ?? "",
      status: record.status,
      exclusionReason: record.exclusionReason ?? "",
      inclusionNotes: record.inclusionNotes ?? "",
      screeningNotes: record.screeningNotes ?? "",
      database: record.database ?? "",
      sourceOrigin: record.sourceOrigin ?? "",
      searchString: record.searchString ?? "",
      importedAt: record.importedAt ?? "",
      screenedAt: record.screenedAt ?? "",
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.sourceTitle?.trim()) {
      return;
    }

    if (editingRecordId) {
      onUpdateRecord(editingRecordId, form);
    } else {
      onCreateRecord(form);
    }

    resetForm();
  }

  function handleSaveCriteria() {
    onSaveCriteria(
      projectId,
      parseCriteria(inclusionCriteria),
      parseCriteria(exclusionCriteria)
    );
  }

  return (
    <section className="literature-panel">
      <div className="literature-panel__header">
        <div>
          <p className="literature-panel__eyebrow">PRISMA</p>
          <h2>Screening Tracker</h2>
          <p>
            Track identified, screened, eligible, included, and excluded records
            without changing source reading statuses.
          </p>
        </div>
      </div>

      <section className="literature-prisma-flow">
        {(["identified", "screened", "eligible", "included"] as const).map(
          (status, index, items) => (
            <div key={status} className="literature-prisma-flow__step">
              <span>{prismaStatusLabels[status]}</span>
              <strong>{counts[status]}</strong>
              {index < items.length - 1 ? <em>→</em> : null}
            </div>
          )
        )}

        <div className="literature-prisma-flow__excluded">
          <span>Excluded</span>
          <strong>{counts.excluded}</strong>
        </div>
      </section>

      <section className="literature-prisma-criteria">
        <label>
          <span>Inclusion criteria</span>
          <textarea
            value={inclusionCriteria}
            onChange={(event) => setInclusionCriteria(event.target.value)}
            placeholder="One criterion per line"
            rows={5}
          />
        </label>

        <label>
          <span>Exclusion criteria</span>
          <textarea
            value={exclusionCriteria}
            onChange={(event) => setExclusionCriteria(event.target.value)}
            placeholder="One reason or criterion per line"
            rows={5}
          />
        </label>

        <button
          className="research-secondary-button"
          type="button"
          onClick={handleSaveCriteria}
        >
          Save criteria
        </button>
      </section>

      <form className="literature-prisma-form" onSubmit={handleSubmit}>
        <div>
          <p className="literature-panel__eyebrow">
            {editingRecordId ? "Edit screening record" : "Add screening record"}
          </p>
        </div>

        <div className="literature-filter-panel literature-filter-panel--wide">
          <label>
            <span>Linked source</span>
            <select
              value={form.sourceId ?? ""}
              onChange={(event) => handleSourceChange(event.target.value)}
            >
              <option value="">No linked source</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Source/title</span>
            <input
              value={form.sourceTitle ?? ""}
              onChange={(event) => updateForm({ sourceTitle: event.target.value })}
              placeholder="Record title"
            />
          </label>

          <label>
            <span>Status</span>
            <select
              value={form.status}
              onChange={(event) =>
                updateForm({ status: event.target.value as ResearchPrismaStatus })
              }
            >
              {Object.entries(prismaStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="literature-filter-panel literature-filter-panel--wide">
          <label>
            <span>Database/source origin</span>
            <input
              value={form.database ?? ""}
              onChange={(event) => updateForm({ database: event.target.value })}
              placeholder="Web of Science, Zotero, hand search..."
            />
          </label>

          <label>
            <span>Search string</span>
            <input
              value={form.searchString ?? ""}
              onChange={(event) => updateForm({ searchString: event.target.value })}
              placeholder="Search terms used"
            />
          </label>

          <label>
            <span>Imported at</span>
            <input
              type="date"
              value={form.importedAt ?? ""}
              onChange={(event) => updateForm({ importedAt: event.target.value })}
            />
          </label>

          <label>
            <span>Screened at</span>
            <input
              type="date"
              value={form.screenedAt ?? ""}
              onChange={(event) => updateForm({ screenedAt: event.target.value })}
            />
          </label>
        </div>

        <div className="literature-prisma-form__notes">
          <label>
            <span>Exclusion reason</span>
            <textarea
              value={form.exclusionReason ?? ""}
              onChange={(event) =>
                updateForm({ exclusionReason: event.target.value })
              }
              rows={3}
            />
          </label>

          <label>
            <span>Inclusion notes</span>
            <textarea
              value={form.inclusionNotes ?? ""}
              onChange={(event) =>
                updateForm({ inclusionNotes: event.target.value })
              }
              rows={3}
            />
          </label>

          <label>
            <span>Screening notes</span>
            <textarea
              value={form.screeningNotes ?? ""}
              onChange={(event) =>
                updateForm({ screeningNotes: event.target.value })
              }
              rows={3}
            />
          </label>
        </div>

        <div className="research-project-card__actions">
          <button className="research-primary-button" type="submit">
            {editingRecordId ? "Save screening record" : "Add screening record"}
          </button>

          {editingRecordId ? (
            <button
              className="research-secondary-button"
              type="button"
              onClick={resetForm}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="literature-filter-panel">
        <label>
          <span>Search</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search title, source, notes, reasons..."
          />
        </label>

        <label>
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as PrismaStatusFilter)
            }
          >
            <option value="all">All statuses</option>
            {Object.entries(prismaStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <button
          className="research-chip-button"
          type="button"
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("all");
          }}
        >
          Reset
        </button>
      </div>

      {Object.keys(exclusionReasonCounts).length > 0 ? (
        <section className="literature-prisma-exclusions">
          <p className="literature-panel__eyebrow">Excluded reasons</p>
          <div>
            {Object.entries(exclusionReasonCounts).map(([reason, count]) => (
              <span key={reason}>
                {reason}: {count}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="research-literature-list">
        {filteredRecords.map((record) => (
          <article key={record.id} className="research-literature-card">
            <div className="research-literature-card__header">
              <div>
                <p className="research-literature-card__eyebrow">
                  {prismaStatusLabels[record.status]}
                </p>
                <h2>{record.sourceTitle ?? "Untitled screening record"}</h2>
              </div>
            </div>

            <div className="research-literature-card__meta">
              {record.database ? <span>{record.database}</span> : null}
              {record.sourceOrigin ? <span>{record.sourceOrigin}</span> : null}
              {record.importedAt ? <span>Imported {record.importedAt}</span> : null}
              {record.screenedAt ? <span>Screened {record.screenedAt}</span> : null}
            </div>

            {record.searchString ? (
              <p className="research-literature-card__notes">
                Search: {record.searchString}
              </p>
            ) : null}
            {record.exclusionReason ? (
              <p className="research-literature-card__notes">
                Exclusion: {record.exclusionReason}
              </p>
            ) : null}
            {record.inclusionNotes ? (
              <p className="research-literature-card__notes">
                Inclusion: {record.inclusionNotes}
              </p>
            ) : null}
            {record.screeningNotes ? (
              <p className="research-literature-card__notes">
                Notes: {record.screeningNotes}
              </p>
            ) : null}

            <div className="research-project-card__actions">
              <button
                className="research-chip-button"
                type="button"
                onClick={() => editRecord(record)}
              >
                Edit
              </button>
              <button
                className="research-chip-button research-chip-button--danger"
                type="button"
                onClick={() => onDeleteRecord(record.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}

        {records.length === 0 ? (
          <div className="research-empty-state">
            No screening records yet. Add records as they move through PRISMA.
          </div>
        ) : null}

        {records.length > 0 && filteredRecords.length === 0 ? (
          <div className="research-empty-state">
            No screening records match these filters.
          </div>
        ) : null}
      </section>
    </section>
  );
}
