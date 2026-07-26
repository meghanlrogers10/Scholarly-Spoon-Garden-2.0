import {
  useState,
  type ClipboardEvent,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { ResearchLargeContentWarning } from "./ResearchLargeContentWarning";
import type {
  ResearchLogEntry,
  ResearchLogAttachment,
  ResearchLogEntryInput,
  ResearchLogEntryType,
  ResearchResultBlock,
  ResearchResultBlockType,
  ResearchResultOutputType,
  ResearchSourceFile,
} from "../types";

type ResearchLogEntryModalProps = {
  projectId: string;
  branchName: string;
  entry?: ResearchLogEntry;
  onClose: () => void;
  onSaveEntry: (entry: ResearchLogEntryInput) => void;
};

const entryTypeLabels: Record<ResearchLogEntryType, string> = {
  progress: "Progress",
  decision: "Decision",
  blocker: "Blocker",
  idea: "Idea",
  "next-action": "Next action",
  results: "Results",
};

const outputTypeLabels: Record<ResearchResultOutputType, string> = {
  stata: "Stata output",
  "excel-table": "Excel/table",
  figure: "Figure",
  model: "Model",
  text: "Text",
  mixed: "Mixed",
};

const blockTypeLabels: Record<ResearchResultBlockType, string> = {
  stata: "Stata",
  "excel-table": "Excel/table",
  image: "PNG figure",
  note: "Note",
};

function createResultBlock(type: ResearchResultBlockType): ResearchResultBlock {
  const now = new Date().toISOString();
  const suffix =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id: `result-block-${suffix}`,
    type,
    title: "",
    text: "",
    html: "",
    plainText: "",
    imageDataUrl: "",
    caption: "",
    createdAt: now,
    updatedAt: now,
  };
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function sanitizePastedTableHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br />");
}

function readFileAsAttachment(file: File): Promise<ResearchLogAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("File could not be read."));
        return;
      }

      resolve({
        id: `attachment-${crypto.randomUUID()}`,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        dataUrl: reader.result,
        createdAt: new Date().toISOString(),
      });
    };
    reader.onerror = () => reject(reader.error ?? new Error("File could not be read."));
    reader.readAsDataURL(file);
  });
}

export function ResearchLogEntryModal({
  projectId,
  branchName,
  entry,
  onClose,
  onSaveEntry,
}: ResearchLogEntryModalProps) {
  const [entryType, setEntryType] = useState<ResearchLogEntryType>(
    entry?.entryType ?? "progress"
  );
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [bodyHtml, setBodyHtml] = useState(entry?.bodyHtml ?? "");
  const [sourceFile, setSourceFile] = useState<ResearchSourceFile | undefined>(
    entry?.sourceFile,
  );
  const [attachments, setAttachments] = useState<ResearchLogAttachment[]>(
    entry?.attachments ?? [],
  );
  const [pinned, setPinned] = useState(entry?.pinned ?? false);
  const [doFile, setDoFile] = useState(entry?.doFile ?? "");
  const [folderPath, setFolderPath] = useState(entry?.folderPath ?? "");
  const [datasetUsed, setDatasetUsed] = useState(entry?.datasetUsed ?? "");
  const [outputLabel, setOutputLabel] = useState(entry?.outputLabel ?? "");
  const [outputType, setOutputType] = useState<ResearchResultOutputType>(
    entry?.outputType ?? "stata"
  );
  const [commandNotes, setCommandNotes] = useState(entry?.commandNotes ?? "");
  const [runDate, setRunDate] = useState(entry?.runDate ?? "");
  const [versionCheckpoint, setVersionCheckpoint] = useState(
    entry?.versionCheckpoint ?? ""
  );
  const [tags, setTags] = useState(entry?.tags?.join(", ") ?? "");
  const [resultBlocks, setResultBlocks] = useState<ResearchResultBlock[]>(
    entry?.resultBlocks ?? []
  );
  const largeContentFields = [
    { label: "entry body", value: body },
    { label: "formatted entry body", value: bodyHtml },
    { label: "command notes", value: commandNotes },
    ...resultBlocks.flatMap((block, index) => [
      {
        label: `result block ${index + 1} text`,
        value: block.text || block.plainText,
      },
      {
        label: `result block ${index + 1} table HTML`,
        value: block.html,
      },
      {
        label: `result block ${index + 1} image`,
        value: block.imageDataUrl,
      },
      {
        label: `result block ${index + 1} caption`,
        value: block.caption,
      },
    ]),
    { label: "source file", value: sourceFile?.dataUrl },
    ...attachments.map((attachment, index) => ({
      label: `attachment ${index + 1}`,
      value: attachment.dataUrl,
    })),
  ];

  function updateResultBlock(
    blockId: string,
    updates: Partial<ResearchResultBlock>
  ) {
    const now = new Date().toISOString();

    setResultBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              ...updates,
              updatedAt: now,
            }
          : block
      )
    );
  }

  function removeResultBlock(blockId: string) {
    setResultBlocks((currentBlocks) =>
      currentBlocks.filter((block) => block.id !== blockId)
    );
  }

  function handleTablePaste(
    event: ClipboardEvent<HTMLDivElement>,
    blockId: string
  ) {
    const html = event.clipboardData.getData("text/html");
    const plainText = event.clipboardData.getData("text/plain");

    updateResultBlock(blockId, {
      html: html ? sanitizePastedTableHtml(html) : "",
      plainText,
    });
  }

  function handleFigureUpload(
    event: ChangeEvent<HTMLInputElement>,
    blockId: string
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || file.type !== "image/png") {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Local MVP stores base64 PNGs in localStorage. Move large images to
        // IndexedDB or Firebase Storage later so localStorage does not balloon.
        updateResultBlock(blockId, { imageDataUrl: reader.result });
      }
    };

    reader.readAsDataURL(file);
  }

  async function handleSourceFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const attachment = await readFileAsAttachment(file);
      setSourceFile({ ...attachment, lastModified: file.lastModified });
    } catch {
      return;
    }
  }

  async function handleAttachmentUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    const nextAttachments = await Promise.all(
      files.map((file) => readFileAsAttachment(file).catch(() => undefined)),
    );
    setAttachments((currentAttachments) => [
      ...currentAttachments,
      ...nextAttachments.filter(
        (attachment): attachment is ResearchLogAttachment => Boolean(attachment),
      ),
    ]);
  }

  async function handleBodyPaste(event: ClipboardEvent<HTMLDivElement>) {
    const files = Array.from(event.clipboardData.files ?? []);

    if (files.length > 0) {
      const pastedAttachments = await Promise.all(
        files.map((file) => readFileAsAttachment(file).catch(() => undefined)),
      );
      setAttachments((currentAttachments) => [
        ...currentAttachments,
        ...pastedAttachments.filter(
          (attachment): attachment is ResearchLogAttachment => Boolean(attachment),
        ),
      ]);
    }

    const html = event.clipboardData.getData("text/html");

    if (html) {
      event.preventDefault();
      document.execCommand("insertHTML", false, sanitizePastedTableHtml(html));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTitle = title.trim();
    const cleanedBody = body.trim();

    if (!cleanedTitle) {
      return;
    }

    onSaveEntry({
      projectId,
      entryType,
      title: cleanedTitle,
      body: cleanedBody || "No details added yet.",
      bodyHtml: bodyHtml ? sanitizePastedTableHtml(bodyHtml) : undefined,
      branch: branchName,
      sourceFile,
      attachments,
      pinned,
      ...(entryType === "results"
        ? {
            doFile,
            folderPath,
            datasetUsed,
            outputLabel,
            outputType,
            commandNotes,
            runDate,
            versionCheckpoint,
            resultBlocks,
            tags: parseTags(tags),
          }
        : {}),
    });

    onClose();
  }

  return (
    <div className="research-modal-backdrop" role="presentation">
      <div
        className="research-modal research-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="research-log-modal-title"
      >
        <div className="research-modal__header">
          <div>
            <p className="eyebrow">{entry ? "Edit log entry" : "New log entry"}</p>
            <h2 id="research-log-modal-title">
              {entry ? "Update the trail." : "Leave breadcrumbs for future you."}
            </h2>
            <p>
              Capture decisions, blockers, ideas, next moves, or reproducible
              results from your analysis workflow.
            </p>
          </div>

          <button
            className="research-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close research log modal"
          >
            ×
          </button>
        </div>

        <form className="research-modal__form" onSubmit={handleSubmit}>
          <div className="research-modal__row">
            <label>
              <span>Entry type</span>
              <select
                value={entryType}
                onChange={(event) =>
                  setEntryType(event.target.value as ResearchLogEntryType)
                }
              >
                {Object.entries(entryTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="research-checkbox-label">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(event) => setPinned(event.target.checked)}
              />
              <span>Pin this entry</span>
            </label>
          </div>

          <label>
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Decided to frame SCD as a conditioning model"
              autoFocus
            />
          </label>

          <div className="research-log-provenance-grid">
            <label>
              <span>Source file</span>
              <input
                type="file"
                accept=".do,.ado,.dta,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.pdf"
                onChange={handleSourceFileUpload}
              />
              {sourceFile ? (
                <span className="research-file-chip">
                  {sourceFile.name} · {Math.max(1, Math.round(sourceFile.size / 1024))} KB
                  <button
                    type="button"
                    className="research-chip-button"
                    onClick={() => setSourceFile(undefined)}
                  >
                    Remove
                  </button>
                </span>
              ) : (
                <small>Keep the do-file, Word document, spreadsheet, or other origin attached.</small>
              )}
            </label>

            <label>
              <span>Attachments</span>
              <input type="file" multiple onChange={handleAttachmentUpload} />
              <small>Paste tables or images into the entry, or add graph files here.</small>
              {attachments.length > 0 ? (
                <div className="research-file-chip-list">
                  {attachments.map((attachment) => (
                    <span className="research-file-chip" key={attachment.id}>
                      {attachment.name}
                      <button
                        type="button"
                        className="research-chip-button"
                        onClick={() =>
                          setAttachments((currentAttachments) =>
                            currentAttachments.filter((item) => item.id !== attachment.id),
                          )
                        }
                      >
                        Remove
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </label>
          </div>

          {entryType === "results" ? (
            <>
              <div className="research-modal__row">
                <label>
                  <span>Do-file/script name</span>
                  <input
                    value={doFile}
                    onChange={(event) => setDoFile(event.target.value)}
                    placeholder="01_models_scd.do"
                  />
                </label>

                <label>
                  <span>Folder/path</span>
                  <input
                    value={folderPath}
                    onChange={(event) => setFolderPath(event.target.value)}
                    placeholder="/analysis/scd/models"
                  />
                </label>
              </div>

              <div className="research-modal__row">
                <label>
                  <span>Dataset used</span>
                  <input
                    value={datasetUsed}
                    onChange={(event) => setDatasetUsed(event.target.value)}
                    placeholder="scd_country_year_v3.dta"
                  />
                </label>

                <label>
                  <span>Output label</span>
                  <input
                    value={outputLabel}
                    onChange={(event) => setOutputLabel(event.target.value)}
                    placeholder="Main FE model, Table 2"
                  />
                </label>
              </div>

              <div className="research-modal__row">
                <label>
                  <span>Output type</span>
                  <select
                    value={outputType}
                    onChange={(event) =>
                      setOutputType(event.target.value as ResearchResultOutputType)
                    }
                  >
                    {Object.entries(outputTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Run date</span>
                  <input
                    type="date"
                    value={runDate}
                    onChange={(event) => setRunDate(event.target.value)}
                  />
                </label>
              </div>

              <div className="research-modal__row">
                <label>
                  <span>Version/checkpoint</span>
                  <input
                    value={versionCheckpoint}
                    onChange={(event) => setVersionCheckpoint(event.target.value)}
                    placeholder="commit, data version, or model checkpoint"
                  />
                </label>

                <label>
                  <span>Tags, comma-separated</span>
                  <input
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="main model, robustness, figure"
                  />
                </label>
              </div>

              <label>
                <span>Command notes</span>
                <textarea
                  value={commandNotes}
                  onChange={(event) => setCommandNotes(event.target.value)}
                  placeholder="Commands run, options changed, caveats, warnings..."
                  rows={3}
                />
              </label>

              <label>
                <span>Interpretation</span>
                <div
                  className="research-rich-editor"
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  onPaste={handleBodyPaste}
                  onInput={(event) => {
                    setBody(event.currentTarget.innerText);
                    setBodyHtml(sanitizePastedTableHtml(event.currentTarget.innerHTML));
                  }}
                  dangerouslySetInnerHTML={{
                    __html: bodyHtml ? sanitizePastedTableHtml(bodyHtml) : escapeHtml(body),
                  }}
                />
              </label>

              <section className="research-result-block-editor">
                <div className="research-result-block-editor__header">
                  <div>
                    <span>Result blocks</span>
                    <p>Keep output structured instead of turning everything into one textarea.</p>
                  </div>

                  <div>
                    {(
                      [
                        "stata",
                        "excel-table",
                        "image",
                        "note",
                      ] as ResearchResultBlockType[]
                    ).map((blockType) => (
                      <button
                        key={blockType}
                        className="research-chip-button"
                        type="button"
                        onClick={() =>
                          setResultBlocks((currentBlocks) => [
                            ...currentBlocks,
                            createResultBlock(blockType),
                          ])
                        }
                      >
                        + {blockTypeLabels[blockType]}
                      </button>
                    ))}
                  </div>
                </div>

                {resultBlocks.map((block) => (
                  <article
                    key={block.id}
                    className={`research-result-block-form research-result-block-form--${block.type}`}
                  >
                    <div className="research-result-block-form__header">
                      <strong>{blockTypeLabels[block.type]} block</strong>

                      <button
                        className="research-chip-button research-chip-button--danger"
                        type="button"
                        onClick={() => removeResultBlock(block.id)}
                      >
                        Remove
                      </button>
                    </div>

                    <label>
                      <span>Block title</span>
                      <input
                        value={block.title ?? ""}
                        onChange={(event) =>
                          updateResultBlock(block.id, {
                            title: event.target.value,
                          })
                        }
                        placeholder="Regression output, Table A1, Figure 2..."
                      />
                    </label>

                    {block.type === "stata" ? (
                      <label>
                        <span>Stata output</span>
                        <textarea
                          className="research-result-block-form__stata-input"
                          value={block.text ?? ""}
                          onChange={(event) =>
                            updateResultBlock(block.id, {
                              text: event.target.value,
                              plainText: event.target.value,
                            })
                          }
                          placeholder="Paste Stata output here..."
                          rows={9}
                        />
                      </label>
                    ) : null}

                    {block.type === "excel-table" ? (
                      <div className="research-result-table-paste">
                        <span>Paste Excel/table output</span>
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          role="textbox"
                          tabIndex={0}
                          onPaste={(event) => handleTablePaste(event, block.id)}
                          onInput={(event) =>
                            updateResultBlock(block.id, {
                              plainText: event.currentTarget.innerText,
                              html: sanitizePastedTableHtml(
                                event.currentTarget.innerHTML
                              ),
                            })
                          }
                          dangerouslySetInnerHTML={{
                            __html: block.html || block.plainText || "",
                          }}
                        />
                      </div>
                    ) : null}

                    {block.type === "image" ? (
                      <>
                        <label>
                          <span>PNG figure</span>
                          <input
                            type="file"
                            accept="image/png"
                            onChange={(event) =>
                              handleFigureUpload(event, block.id)
                            }
                          />
                        </label>

                        {block.imageDataUrl ? (
                          <img
                            className="research-result-image-preview"
                            src={block.imageDataUrl}
                            alt={block.caption || block.title || "Result figure"}
                          />
                        ) : null}

                        <label>
                          <span>Caption</span>
                          <textarea
                            value={block.caption ?? ""}
                            onChange={(event) =>
                              updateResultBlock(block.id, {
                                caption: event.target.value,
                              })
                            }
                            placeholder="Figure caption or interpretation note..."
                            rows={3}
                          />
                        </label>
                      </>
                    ) : null}

                    {block.type === "note" ? (
                      <label>
                        <span>Note</span>
                        <textarea
                          value={block.text ?? ""}
                          onChange={(event) =>
                            updateResultBlock(block.id, {
                              text: event.target.value,
                              plainText: event.target.value,
                            })
                          }
                          placeholder="A short result-specific note..."
                          rows={4}
                        />
                      </label>
                    ) : null}
                  </article>
                ))}

                {resultBlocks.length === 0 ? (
                  <div className="research-empty-state">
                    No result blocks yet. Add Stata output, an Excel/table
                    paste, a PNG figure, or a note.
                  </div>
                ) : null}
              </section>
            </>
          ) : (
            <label>
              <span>Entry</span>
              <div
                className="research-rich-editor"
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                onPaste={handleBodyPaste}
                onInput={(event) => {
                  setBody(event.currentTarget.innerText);
                  setBodyHtml(sanitizePastedTableHtml(event.currentTarget.innerHTML));
                }}
                dangerouslySetInnerHTML={{
                  __html: bodyHtml ? sanitizePastedTableHtml(bodyHtml) : escapeHtml(body),
                }}
              />
            </label>
          )}

          <ResearchLargeContentWarning fields={largeContentFields} />

          <div className="research-modal__actions">
            <button
              className="research-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button className="research-primary-button" type="submit">
              {entry ? "Save entry" : "Add entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
