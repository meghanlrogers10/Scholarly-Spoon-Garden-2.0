import { useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";

type QuickCaptureCardProps = {
  onSave: (text: string) => void;
};

export function QuickCaptureCard({ onSave }: QuickCaptureCardProps) {
  const [note, setNote] = useState("");

  function handleSave() {
    const cleanedNote = note.trim();

    if (!cleanedNote) {
      return;
    }

    onSave(cleanedNote);
    setNote("");
  }

  return (
    <Card>
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Capture</p>
          <h2>Quick Capture</h2>
        </div>
      </div>

      <textarea
        className="quick-capture-input"
        placeholder="Dump the thing before it escapes..."
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />

      <div className="capture-footer">
        <span className="muted-text">{note.length} characters</span>
        <Button variant="soft" onClick={handleSave}>
          Save capture
        </Button>
      </div>
    </Card>
  );
}