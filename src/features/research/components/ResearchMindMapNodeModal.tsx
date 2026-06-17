import { useState, type FormEvent } from "react";
import { ResearchLargeContentWarning } from "./ResearchLargeContentWarning";
import type {
  ResearchLiteratureNote,
  ResearchLiteratureSource,
  ResearchMindMapNode,
  ResearchMindMapNodeInput,
  ResearchMindMapNodeType,
  ResearchSynthesisSection,
} from "../types";

type ResearchMindMapNodeModalProps = {
  projectId: string;
  node?: ResearchMindMapNode;
  sources: ResearchLiteratureSource[];
  notes: ResearchLiteratureNote[];
  synthesisSections: ResearchSynthesisSection[];
  onClose: () => void;
  onSaveNode: (node: ResearchMindMapNodeInput) => void;
};

const mindMapNodeTypeLabels: Record<ResearchMindMapNodeType, string> = {
  theme: "Theme",
  source: "Source",
  note: "Source note",
  argument: "Argument",
  gap: "Gap",
  question: "Question",
};

export function ResearchMindMapNodeModal({
  projectId,
  node,
  sources,
  notes,
  synthesisSections,
  onClose,
  onSaveNode,
}: ResearchMindMapNodeModalProps) {
  const [nodeType, setNodeType] = useState<ResearchMindMapNodeType>(
    node?.nodeType ?? "argument"
  );
  const [title, setTitle] = useState(node?.title ?? "");
  const [body, setBody] = useState(node?.body ?? "");
  const [sourceId, setSourceId] = useState(node?.sourceId ?? "");
  const [noteId, setNoteId] = useState(node?.noteId ?? "");
  const [synthesisSectionId, setSynthesisSectionId] = useState(
    node?.synthesisSectionId ?? ""
  );
  const [relatedThemes, setRelatedThemes] = useState(
    node?.relatedThemes?.join(", ") ?? ""
  );
  const [pinned, setPinned] = useState(node?.pinned ?? false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      return;
    }

    const selectedSource = sources.find((source) => source.id === sourceId);
    const selectedNote = notes.find((note) => note.id === noteId);
    const selectedSynthesisSection = synthesisSections.find(
      (section) => section.id === synthesisSectionId
    );

    onSaveNode({
      projectId,
      nodeType,
      title: cleanedTitle,
      body,
      sourceId: selectedSource?.id,
      sourceTitle: selectedSource?.title,
      noteId: selectedNote?.id,
      noteTitle: selectedNote?.title,
      synthesisSectionId: selectedSynthesisSection?.id,
      synthesisSectionTitle: selectedSynthesisSection?.title,
      relatedThemes: relatedThemes
        .split(",")
        .map((theme) => theme.trim().replace(/\s+/g, " "))
        .filter(Boolean),
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
        aria-labelledby="research-mindmap-node-modal-title"
      >
        <div className="research-modal__header">
          <div>
            <p className="eyebrow">{node ? "Edit map node" : "New map node"}</p>
            <h2 id="research-mindmap-node-modal-title">
              {node ? "Update this map node." : "Add a manual mind map node."}
            </h2>
            <p>
              Use manual nodes for arguments, gaps, questions, sources, and
              notes that need to stay visible.
            </p>
          </div>

          <button
            className="research-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close mind map node modal"
          >
            ×
          </button>
        </div>

        <form className="research-modal__form" onSubmit={handleSubmit}>
          <div className="research-modal__row">
            <label>
              <span>Node type</span>
              <select
                value={nodeType}
                onChange={(event) =>
                  setNodeType(event.target.value as ResearchMindMapNodeType)
                }
              >
                {Object.entries(mindMapNodeTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Linked source</span>
              <select
                value={sourceId}
                onChange={(event) => setSourceId(event.target.value)}
              >
                <option value="">No linked source</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="research-modal__row">
            <label>
              <span>Linked source note</span>
              <select
                value={noteId}
                onChange={(event) => setNoteId(event.target.value)}
              >
                <option value="">No linked source note</option>
                {notes.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Linked synthesis section</span>
              <select
                value={synthesisSectionId}
                onChange={(event) => setSynthesisSectionId(event.target.value)}
              >
                <option value="">No linked synthesis section</option>
                {synthesisSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Mechanism, gap, source cluster, question..."
              autoFocus
            />
          </label>

          <label>
            <span>Body</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Why this node matters, what it connects, or what to do with it."
              rows={5}
            />
          </label>

          <label>
            <span>Related themes</span>
            <input
              value={relatedThemes}
              onChange={(event) => setRelatedThemes(event.target.value)}
              placeholder="Comma-separated themes"
            />
          </label>

          <label className="research-checkbox-label">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
            />
            <span>Pin this map node</span>
          </label>

          <ResearchLargeContentWarning
            fields={[{ label: "map node body", value: body }]}
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
              {node ? "Save node" : "Add node"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
