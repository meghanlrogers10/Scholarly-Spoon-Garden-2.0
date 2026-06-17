type ResearchLargeContentField = {
  label: string;
  value?: string | null;
};

const LARGE_CONTENT_WARNING_CHARS = 12000;

function formatApproxSize(characters: number) {
  return `${Math.max(1, Math.round(characters / 1024))} KB`;
}

function getLargeResearchContentFields(fields: ResearchLargeContentField[]) {
  return fields
    .map((field) => ({
      ...field,
      size: field.value?.length ?? 0,
    }))
    .filter((field) => field.size >= LARGE_CONTENT_WARNING_CHARS)
    .sort((a, b) => b.size - a.size);
}

export function ResearchLargeContentWarning({
  fields,
}: {
  fields: ResearchLargeContentField[];
}) {
  const largeFields = getLargeResearchContentFields(fields);

  if (largeFields.length === 0) {
    return null;
  }

  const labels = largeFields
    .slice(0, 3)
    .map((field) => `${field.label} (${formatApproxSize(field.size)})`)
    .join(", ");

  return (
    <p className="research-storage-warning" role="status">
      Large pasted content in {labels} may make localStorage slower. Saving is
      still allowed; future cloud/file storage should move these heavy Research
      fields out of localStorage.
    </p>
  );
}
