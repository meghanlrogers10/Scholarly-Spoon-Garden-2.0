import type {
  ResearchLiteratureNote,
  ResearchLiteratureReadingNote,
  ResearchLiteratureSource,
  ResearchMindMapNode,
  ResearchPrismaCriteria,
  ResearchPrismaRecord,
  ResearchPrismaStatus,
  ResearchSynthesisSection,
} from "../../types";

type LiteratureWritingPacketOptions = {
  projectTitle: string;
  exportedAt: string;
  sources: ResearchLiteratureSource[];
  notes: ResearchLiteratureNote[];
  readingNotes: ResearchLiteratureReadingNote[];
  themes: string[];
  synthesisSections: ResearchSynthesisSection[];
  mindMapNodes: ResearchMindMapNode[];
  prismaRecords?: ResearchPrismaRecord[];
  prismaCriteria?: ResearchPrismaCriteria;
};

const prismaStatusLabels: Record<ResearchPrismaStatus, string> = {
  identified: "Identified",
  screened: "Screened",
  eligible: "Eligible",
  included: "Included",
  excluded: "Excluded",
};

const readingNoteSectionLabels: Record<
  keyof ResearchLiteratureReadingNote["sections"],
  string
> = {
  researchQuestion: "Research Question",
  litReview: "Lit Review",
  theory: "Theory",
  hypotheses: "Hypotheses",
  dataSample: "Data/Sample",
  methods: "Methods",
  findingsConclusion: "Findings/Conclusion",
  quotes: "Quotes",
  futureResearch: "Future Research",
  generalNotes: "General Notes",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getSourceCitation(source: ResearchLiteratureSource) {
  return [source.authors, source.year].filter(Boolean).join(" · ");
}

function getReadingNoteThemes(note: ResearchLiteratureReadingNote) {
  return Array.from(new Set([...note.extractedThemes, ...note.manualThemes]));
}

function sourceById(sources: ResearchLiteratureSource[]) {
  return new Map(sources.map((source) => [source.id, source]));
}

function noteById(notes: ResearchLiteratureNote[]) {
  return new Map(notes.map((note) => [note.id, note]));
}

function mdList(lines: string[]) {
  return lines.length > 0 ? lines.map((line) => `- ${line}`).join("\n") : "_None yet._";
}

function buildReadingNoteMarkdown(note: ResearchLiteratureReadingNote) {
  const sectionLines = Object.entries(note.sections)
    .filter(([, value]) => value.trim())
    .map(
      ([key, value]) =>
        `  - ${readingNoteSectionLabels[
          key as keyof ResearchLiteratureReadingNote["sections"]
        ]}: ${value.trim()}`
    );

  return [
    `- ${note.sourceTitle}`,
    getReadingNoteThemes(note).length > 0
      ? `  - Themes: ${getReadingNoteThemes(note).join(", ")}`
      : "",
    ...sectionLines,
    note.body ? `  - General body: ${note.body}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSourceMarkdown(source: ResearchLiteratureSource) {
  return [
    `- ${source.title}`,
    getSourceCitation(source) ? `  - ${getSourceCitation(source)}` : "",
    `  - Type/status: ${source.sourceType} · ${source.status}`,
    source.link ? `  - Link: ${source.link}` : "",
    source.themes.length > 0 ? `  - Themes: ${source.themes.join(", ")}` : "",
    source.notes ? `  - Notes: ${source.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildStructuredNoteMarkdown(note: ResearchLiteratureNote) {
  return [
    `- ${note.title}`,
    `  - Kind: ${note.noteKind}`,
    note.sourceTitle ? `  - Source: ${note.sourceTitle}` : "",
    note.themes.length > 0 ? `  - Themes: ${note.themes.join(", ")}` : "",
    note.keyQuote ? `  - Key quote: ${note.keyQuote}` : "",
    note.argumentSlot ? `  - Argument slot: ${note.argumentSlot}` : "",
    `  - Note: ${note.body}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSynthesisMarkdown(
  section: ResearchSynthesisSection,
  sources: ResearchLiteratureSource[],
  notes: ResearchLiteratureNote[]
) {
  const sourcesMap = sourceById(sources);
  const notesMap = noteById(notes);
  const linkedSources = section.linkedSourceIds
    .map((sourceId) => sourcesMap.get(sourceId)?.title)
    .filter(Boolean);
  const linkedNotes = section.linkedNoteIds
    .map((noteId) => notesMap.get(noteId)?.title)
    .filter(Boolean);

  return [
    `### ${section.title}`,
    `Status: ${section.status}`,
    section.themes.length > 0 ? `Themes: ${section.themes.join(", ")}` : "",
    "",
    section.claim,
    section.draftNote ? `\nDraft note: ${section.draftNote}` : "",
    linkedSources.length > 0
      ? `\nLinked sources:\n${mdList(linkedSources as string[])}`
      : "",
    linkedNotes.length > 0 ? `\nLinked notes:\n${mdList(linkedNotes as string[])}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildLiteratureReviewMarkdown({
  projectTitle,
  exportedAt,
  sources,
  notes,
  readingNotes,
  themes,
  synthesisSections,
  mindMapNodes,
  prismaRecords = [],
  prismaCriteria,
}: LiteratureWritingPacketOptions) {
  const notesByTheme = themes.map((theme) => {
    const structured = notes.filter((note) => note.themes.includes(theme));
    const reading = readingNotes.filter((note) =>
      getReadingNoteThemes(note).includes(theme)
    );
    const items = [
      ...structured.map(buildStructuredNoteMarkdown),
      ...reading.map(buildReadingNoteMarkdown),
    ];

    return `### ${theme}\n\n${items.length > 0 ? items.join("\n") : "_No notes yet._"}`;
  });
  const keyQuotes = [
    ...sources
      .filter((source) => source.keyQuote)
      .map((source) => `- ${source.title}: "${source.keyQuote}"`),
    ...notes
      .filter((note) => note.keyQuote)
      .map((note) => `- ${note.title}: "${note.keyQuote}"`),
  ];

  return [
    `# ${projectTitle} Literature Review Packet`,
    `Exported: ${exportedAt}`,
    "## Sources",
    sources.length > 0 ? sources.map(buildSourceMarkdown).join("\n") : "_No sources yet._",
    "## Themes",
    themes.length > 0 ? mdList(themes) : "_No themes yet._",
    "## PRISMA / Screening",
    [
      `- Identified: ${prismaRecords.filter((record) => record.status === "identified").length}`,
      `- Screened: ${prismaRecords.filter((record) => record.status === "screened").length}`,
      `- Eligible: ${prismaRecords.filter((record) => record.status === "eligible").length}`,
      `- Included: ${prismaRecords.filter((record) => record.status === "included").length}`,
      `- Excluded: ${prismaRecords.filter((record) => record.status === "excluded").length}`,
      prismaCriteria?.inclusionCriteria.length
        ? `\nInclusion criteria:\n${mdList(prismaCriteria.inclusionCriteria)}`
        : "",
      prismaCriteria?.exclusionCriteria.length
        ? `\nExclusion criteria:\n${mdList(prismaCriteria.exclusionCriteria)}`
        : "",
      prismaRecords.length
        ? `\nScreening records:\n${prismaRecords
            .map(
              (record) =>
                `- ${record.sourceTitle ?? "Untitled"} · ${
                  prismaStatusLabels[record.status]
                }${
                  record.exclusionReason
                    ? ` · Exclusion: ${record.exclusionReason}`
                    : ""
                }`
            )
            .join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
    "## Notes by Theme",
    notesByTheme.length > 0 ? notesByTheme.join("\n\n") : "_No themed notes yet._",
    "## Structured Source Notes",
    notes.length > 0 ? notes.map(buildStructuredNoteMarkdown).join("\n") : "_No structured notes yet._",
    "## Reading Notes Lab Sections",
    readingNotes.length > 0
      ? readingNotes.map(buildReadingNoteMarkdown).join("\n")
      : "_No reading lab notes yet._",
    "## Synthesis Outline",
    synthesisSections.length > 0
      ? synthesisSections
          .map((section) => buildSynthesisMarkdown(section, sources, notes))
          .join("\n\n")
      : "_No synthesis sections yet._",
    "## Key Quotes",
    keyQuotes.length > 0 ? keyQuotes.join("\n") : "_No key quotes yet._",
    "## Mind Map Summary",
    mindMapNodes.length > 0
      ? mindMapNodes
          .map(
            (node) =>
              `- ${node.title} (${node.nodeType})${
                node.sourceTitle ||
                node.noteTitle ||
                node.synthesisSectionTitle ||
                node.relatedThemes?.length
                  ? ` · ${[
                      node.sourceTitle,
                      node.noteTitle,
                      node.synthesisSectionTitle,
                      node.relatedThemes?.join(", "),
                    ]
                      .filter(Boolean)
                      .join(" · ")}`
                  : ""
              }${node.body ? `\n  - ${node.body}` : ""}`
          )
          .join("\n")
      : "_No mind map nodes yet._",
  ].join("\n\n");
}

function htmlList(items: string[]) {
  return items.length > 0
    ? `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : "<p><em>None yet.</em></p>";
}

function buildSourceHtml(source: ResearchLiteratureSource) {
  return `<li>
    <strong>${escapeHtml(source.title)}</strong>
    ${getSourceCitation(source) ? `<div>${escapeHtml(getSourceCitation(source))}</div>` : ""}
    <div>${escapeHtml(source.sourceType)} · ${escapeHtml(source.status)}</div>
    ${source.link ? `<div>${escapeHtml(source.link)}</div>` : ""}
    ${
      source.themes.length > 0
        ? `<div>Themes: ${escapeHtml(source.themes.join(", "))}</div>`
        : ""
    }
    ${source.notes ? `<p>${escapeHtml(source.notes)}</p>` : ""}
  </li>`;
}

function buildStructuredNoteHtml(note: ResearchLiteratureNote) {
  return `<li>
    <strong>${escapeHtml(note.title)}</strong>
    <div>${escapeHtml(note.noteKind)}${note.sourceTitle ? ` · ${escapeHtml(note.sourceTitle)}` : ""}</div>
    ${note.themes.length > 0 ? `<div>Themes: ${escapeHtml(note.themes.join(", "))}</div>` : ""}
    ${note.keyQuote ? `<blockquote>${escapeHtml(note.keyQuote)}</blockquote>` : ""}
    ${note.argumentSlot ? `<div>Argument slot: ${escapeHtml(note.argumentSlot)}</div>` : ""}
    <p>${escapeHtml(note.body)}</p>
  </li>`;
}

function buildReadingNoteHtml(note: ResearchLiteratureReadingNote) {
  const sections = Object.entries(note.sections)
    .filter(([, value]) => value.trim())
    .map(
      ([key, value]) =>
        `<li><strong>${escapeHtml(
          readingNoteSectionLabels[
            key as keyof ResearchLiteratureReadingNote["sections"]
          ]
        )}:</strong> ${escapeHtml(value)}</li>`
    )
    .join("");

  return `<li>
    <strong>${escapeHtml(note.sourceTitle)}</strong>
    ${
      getReadingNoteThemes(note).length > 0
        ? `<div>Themes: ${escapeHtml(getReadingNoteThemes(note).join(", "))}</div>`
        : ""
    }
    ${sections ? `<ul>${sections}</ul>` : ""}
    ${note.body ? `<p>${escapeHtml(note.body)}</p>` : ""}
  </li>`;
}

export function buildLiteratureReviewHtml(options: LiteratureWritingPacketOptions) {
  const {
    projectTitle,
    exportedAt,
    sources,
    notes,
    readingNotes,
    themes,
  synthesisSections,
  mindMapNodes,
    prismaRecords = [],
    prismaCriteria,
  } = options;
  const notesByTheme = themes
    .map((theme) => {
      const structured = notes.filter((note) => note.themes.includes(theme));
      const reading = readingNotes.filter((note) =>
        getReadingNoteThemes(note).includes(theme)
      );
      const items = [
        ...structured.map(buildStructuredNoteHtml),
        ...reading.map(buildReadingNoteHtml),
      ];

      return `<section><h3>${escapeHtml(theme)}</h3>${
        items.length > 0 ? `<ul>${items.join("")}</ul>` : "<p><em>No notes yet.</em></p>"
      }</section>`;
    })
    .join("");
  const quotes = [
    ...sources
      .filter((source) => source.keyQuote)
      .map(
        (source) =>
          `<li><strong>${escapeHtml(source.title)}:</strong> <blockquote>${escapeHtml(
            source.keyQuote ?? ""
          )}</blockquote></li>`
      ),
    ...notes
      .filter((note) => note.keyQuote)
      .map(
        (note) =>
          `<li><strong>${escapeHtml(note.title)}:</strong> <blockquote>${escapeHtml(
            note.keyQuote ?? ""
          )}</blockquote></li>`
      ),
  ];
  const sourcesMap = sourceById(sources);
  const notesMap = noteById(notes);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(projectTitle)} Literature Review Packet</title>
    <style>
      body { margin: 0; background: #fffaf5; color: #2f2437; font-family: Georgia, "Times New Roman", serif; line-height: 1.5; }
      main { width: min(940px, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 3rem; }
      h1, h2, h3 { color: #4d3575; }
      section { break-inside: avoid; page-break-inside: avoid; margin-top: 1.5rem; }
      blockquote { border-left: 4px solid #b8a6d9; margin: 0.5rem 0; padding-left: 0.8rem; }
      li { margin: 0.45rem 0; }
      .export-meta { color: #776a7f; }
      .print-toolbar { position: sticky; top: 0; display: flex; justify-content: space-between; gap: 1rem; padding: 0.8rem 1rem; background: #fff; border: 1px solid #dbcdbf; border-radius: 12px; box-shadow: 0 8px 24px rgba(47, 36, 55, 0.12); font-family: system-ui, sans-serif; }
      .print-toolbar button { border: 0; border-radius: 999px; padding: 0.7rem 1rem; background: #4d3575; color: white; font-weight: 800; cursor: pointer; }
      @media print { body { background: white; } main { width: auto; padding: 0; } .print-toolbar { display: none; } }
    </style>
  </head>
  <body>
    <main>
      <div class="print-toolbar">
        <p>Use browser print to save this literature packet as PDF.</p>
        <button type="button" onclick="window.print()">Print / Save as PDF</button>
      </div>
      <h1>${escapeHtml(projectTitle)} Literature Review Packet</h1>
      <p class="export-meta">Exported: ${escapeHtml(exportedAt)}</p>
      <section><h2>Sources</h2>${sources.length > 0 ? `<ul>${sources.map(buildSourceHtml).join("")}</ul>` : "<p><em>No sources yet.</em></p>"}</section>
      <section><h2>Themes</h2>${htmlList(themes.map(escapeHtml))}</section>
      <section><h2>PRISMA / Screening</h2>
        <ul>
          ${(["identified", "screened", "eligible", "included", "excluded"] as ResearchPrismaStatus[])
            .map(
              (status) =>
                `<li><strong>${prismaStatusLabels[status]}:</strong> ${
                  prismaRecords.filter((record) => record.status === status).length
                }</li>`
            )
            .join("")}
        </ul>
        ${
          prismaCriteria?.inclusionCriteria.length
            ? `<h3>Inclusion Criteria</h3>${htmlList(
                prismaCriteria.inclusionCriteria.map(escapeHtml)
              )}`
            : ""
        }
        ${
          prismaCriteria?.exclusionCriteria.length
            ? `<h3>Exclusion Criteria</h3>${htmlList(
                prismaCriteria.exclusionCriteria.map(escapeHtml)
              )}`
            : ""
        }
        ${
          prismaRecords.length
            ? `<h3>Screening Records</h3><ul>${prismaRecords
                .map(
                  (record) =>
                    `<li><strong>${escapeHtml(
                      record.sourceTitle ?? "Untitled"
                    )}</strong> · ${escapeHtml(prismaStatusLabels[record.status])}${
                      record.exclusionReason
                        ? ` · Exclusion: ${escapeHtml(record.exclusionReason)}`
                        : ""
                    }</li>`
                )
                .join("")}</ul>`
            : ""
        }
      </section>
      <section><h2>Notes by Theme</h2>${notesByTheme || "<p><em>No themed notes yet.</em></p>"}</section>
      <section><h2>Structured Source Notes</h2>${notes.length > 0 ? `<ul>${notes.map(buildStructuredNoteHtml).join("")}</ul>` : "<p><em>No structured notes yet.</em></p>"}</section>
      <section><h2>Reading Notes Lab Sections</h2>${readingNotes.length > 0 ? `<ul>${readingNotes.map(buildReadingNoteHtml).join("")}</ul>` : "<p><em>No reading lab notes yet.</em></p>"}</section>
      <section><h2>Synthesis Outline</h2>${
        synthesisSections.length > 0
          ? synthesisSections
              .map((section) => {
                const linkedSources = section.linkedSourceIds
                  .map((sourceId) => sourcesMap.get(sourceId)?.title)
                  .filter(Boolean) as string[];
                const linkedNotes = section.linkedNoteIds
                  .map((noteId) => notesMap.get(noteId)?.title)
                  .filter(Boolean) as string[];

                return `<article><h3>${escapeHtml(section.title)}</h3><p><strong>Status:</strong> ${escapeHtml(section.status)}</p><p>${escapeHtml(section.claim)}</p>${
                  section.themes.length > 0
                    ? `<p><strong>Themes:</strong> ${escapeHtml(section.themes.join(", "))}</p>`
                    : ""
                }${section.draftNote ? `<p>${escapeHtml(section.draftNote)}</p>` : ""}${
                  linkedSources.length > 0
                    ? `<p><strong>Linked sources:</strong> ${escapeHtml(linkedSources.join(", "))}</p>`
                    : ""
                }${
                  linkedNotes.length > 0
                    ? `<p><strong>Linked notes:</strong> ${escapeHtml(linkedNotes.join(", "))}</p>`
                    : ""
                }</article>`;
              })
              .join("")
          : "<p><em>No synthesis sections yet.</em></p>"
      }</section>
      <section><h2>Key Quotes</h2>${quotes.length > 0 ? `<ul>${quotes.join("")}</ul>` : "<p><em>No key quotes yet.</em></p>"}</section>
      <section><h2>Mind Map Summary</h2>${
        mindMapNodes.length > 0
          ? `<ul>${mindMapNodes
              .map(
                (node) =>
                  `<li><strong>${escapeHtml(node.title)}</strong> (${escapeHtml(
                    node.nodeType
                  )})${
                    node.sourceTitle ||
                    node.noteTitle ||
                    node.synthesisSectionTitle ||
                    node.relatedThemes?.length
                      ? ` · ${escapeHtml(
                          [
                            node.sourceTitle,
                            node.noteTitle,
                            node.synthesisSectionTitle,
                            node.relatedThemes?.join(", "),
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        )}`
                      : ""
                  }${node.body ? `<p>${escapeHtml(node.body)}</p>` : ""}</li>`
              )
              .join("")}</ul>`
          : "<p><em>No mind map nodes yet.</em></p>"
      }</section>
    </main>
  </body>
</html>`;
}

export function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
