import type { ChangeEvent } from "react";

type LiteratureImportExportControlsProps = {
  onAddSource: () => void;
  onExportWorkspace: () => void;
  onImportWorkspace: (event: ChangeEvent<HTMLInputElement>) => void;
  onExportReviewMarkdown: () => void;
  onExportReviewWord: () => void;
  onPrintReviewPacket: () => void;
};

export function LiteratureImportExportControls({
  onAddSource,
  onExportWorkspace,
  onImportWorkspace,
  onExportReviewMarkdown,
  onExportReviewWord,
  onPrintReviewPacket,
}: LiteratureImportExportControlsProps) {
  return (
    <div className="research-hero-panel__actions">
      <button
        className="research-primary-button"
        type="button"
        onClick={onAddSource}
      >
        + Add Source
      </button>

      <button
        className="research-secondary-button"
        type="button"
        onClick={onExportWorkspace}
      >
        Export Backup JSON
      </button>

      <button
        className="research-secondary-button"
        type="button"
        onClick={onExportReviewMarkdown}
      >
        Export Literature Review Markdown
      </button>

      <button
        className="research-secondary-button"
        type="button"
        onClick={onExportReviewWord}
      >
        Export Literature Review Word
      </button>

      <button
        className="research-secondary-button"
        type="button"
        onClick={onPrintReviewPacket}
      >
        Print Literature Review Packet
      </button>

      <label className="research-secondary-button research-file-import-button">
        Import Backup JSON
        <input
          type="file"
          accept="application/json,.json"
          onChange={onImportWorkspace}
        />
      </label>
    </div>
  );
}
