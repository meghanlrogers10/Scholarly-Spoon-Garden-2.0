import {
  getChecklistCompletion,
  prepChecklistItems,
  type PrepChecklistValue,
} from "./prepChecklistUtils";

type PrepChecklistProps = {
  value?: PrepChecklistValue;
  onChange?: (value: PrepChecklistValue) => void;
  readOnly?: boolean;
};

export function PrepChecklist({
  value = {},
  onChange,
  readOnly = false,
}: PrepChecklistProps) {
  const completion = getChecklistCompletion(value);

  return (
    <div className="teaching-prep-checklist">
      <div className="teaching-prep-checklist__summary">
        <span>Checklist</span>
        <strong>
          {completion.completed}/{completion.total}
        </strong>
      </div>

      <div className="teaching-prep-checklist__items">
        {prepChecklistItems.map((item) => (
          <label key={item.key} className="teaching-checkbox-row">
            <input
              type="checkbox"
              name={item.key}
              checked={Boolean(value[item.key])}
              disabled={readOnly}
              onChange={(event) =>
                onChange?.({ ...value, [item.key]: event.target.checked })
              }
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
