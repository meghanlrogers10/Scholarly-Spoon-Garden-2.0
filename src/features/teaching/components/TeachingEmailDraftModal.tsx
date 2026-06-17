import type { TeachingEmailDraft } from "../utils/teachingEmailTemplates";

type TeachingEmailDraftModalProps = {
  draft: TeachingEmailDraft;
  onClose: () => void;
  onMarkSent?: () => void;
};

async function copyText(value: string) {
  await navigator.clipboard?.writeText(value);
}

export function TeachingEmailDraftModal({
  draft,
  onClose,
  onMarkSent,
}: TeachingEmailDraftModalProps) {
  const fullEmail = `To: ${draft.to || ""}\nSubject: ${draft.subject}\n\n${draft.body}`;
  const mailtoHref = draft.to
    ? `mailto:${encodeURIComponent(draft.to)}?subject=${encodeURIComponent(
        draft.subject
      )}&body=${encodeURIComponent(draft.body)}`
    : undefined;

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal teaching-modal--wide" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">Email draft</p>
            <h2>Copy, edit, then send yourself</h2>
            <p>Opening this draft does not mark anything sent.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="teaching-email-draft">
          <label>
            <span>To</span>
            <input readOnly value={draft.to || ""} />
          </label>
          <label>
            <span>Subject</span>
            <input readOnly value={draft.subject} />
          </label>
          <label>
            <span>Body</span>
            <textarea readOnly rows={14} value={draft.body} />
          </label>
        </div>

        <div className="teaching-modal__actions">
          <button className="teaching-secondary-button" type="button" onClick={() => copyText(draft.subject)}>
            Copy subject
          </button>
          <button className="teaching-secondary-button" type="button" onClick={() => copyText(draft.body)}>
            Copy body
          </button>
          <button className="teaching-secondary-button" type="button" onClick={() => copyText(fullEmail)}>
            Copy full email
          </button>
          {mailtoHref ? (
            <a className="teaching-secondary-button" href={mailtoHref}>
              Open mailto
            </a>
          ) : null}
          {onMarkSent ? (
            <button className="teaching-primary-button" type="button" onClick={onMarkSent}>
              Mark sent
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
