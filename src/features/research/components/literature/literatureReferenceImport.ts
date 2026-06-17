import type {
  ResearchLiteratureSource,
  ResearchLiteratureSourceInput,
  ResearchLiteratureSourceType,
} from "../../types";

export type ReferenceImportFormat = "bibtex" | "ris";

export type ReferenceImportCandidate = {
  id: string;
  source: ResearchLiteratureSourceInput;
  doi?: string;
  venue?: string;
  abstract?: string;
  duplicate: boolean;
  duplicateReason?: string;
};

type ParsedReference = {
  title?: string;
  authors?: string;
  year?: string;
  sourceType: ResearchLiteratureSourceType;
  venue?: string;
  publisher?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  keywords: string[];
};

type PrepareReferenceImportOptions = {
  text: string;
  format: ReferenceImportFormat;
  projectId: string;
  existingSources: ResearchLiteratureSource[];
};

const bibTypeMap: Record<string, ResearchLiteratureSourceType> = {
  article: "article",
  book: "book",
  inbook: "chapter",
  incollection: "chapter",
  inproceedings: "chapter",
  conference: "chapter",
  proceedings: "chapter",
  techreport: "report",
  report: "report",
  dataset: "dataset",
  online: "website",
  webpage: "website",
  website: "website",
};

const risTypeMap: Record<string, ResearchLiteratureSourceType> = {
  JOUR: "article",
  JFULL: "article",
  MGZN: "article",
  NEWS: "article",
  BOOK: "book",
  CHAP: "chapter",
  RPRT: "report",
  DATA: "dataset",
  WEB: "website",
  ELEC: "website",
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanValue(value: string) {
  return normalizeWhitespace(
    value
      .replace(/^["{]+|["}]+$/g, "")
      .replace(/[{}]/g, "")
      .replace(/\\&/g, "&")
  );
}

function normalizeDoi(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .toLowerCase();

  return normalized || undefined;
}

function extractDoi(value?: string) {
  if (!value) {
    return undefined;
  }

  const explicit = value.match(/(?:doi:\s*|doi\.org\/)(10\.\S+)/i);
  if (explicit?.[1]) {
    return normalizeDoi(explicit[1].replace(/[)\].,;]+$/g, ""));
  }

  const bare = value.match(/\b(10\.\d{4,9}\/[^\s"<>]+)\b/i);
  return bare?.[1] ? normalizeDoi(bare[1].replace(/[)\].,;]+$/g, "")) : undefined;
}

function normalizeFingerprintPart(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleAuthorYearFingerprint(reference: {
  title?: string;
  authors?: string;
  year?: string;
}) {
  return [
    normalizeFingerprintPart(reference.title),
    normalizeFingerprintPart(reference.authors),
    normalizeFingerprintPart(reference.year),
  ].join("|");
}

function splitKeywords(value?: string) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[;,]/)
        .map((keyword) => normalizeWhitespace(keyword))
        .filter(Boolean)
    )
  );
}

function formatAuthors(value?: string) {
  if (!value) {
    return undefined;
  }

  const authors = value
    .split(/\s+and\s+/i)
    .map((author) => {
      const cleaned = cleanValue(author);
      const [last, first] = cleaned.split(",").map((part) => part.trim());

      if (first && last) {
        return `${first} ${last}`;
      }

      return cleaned;
    })
    .filter(Boolean);

  return authors.length > 0 ? authors.join("; ") : undefined;
}

function getYear(value?: string) {
  return value?.match(/\d{4}/)?.[0];
}

function findBibEntries(text: string) {
  const entries: { type: string; body: string }[] = [];
  let index = 0;

  while (index < text.length) {
    const atIndex = text.indexOf("@", index);
    if (atIndex === -1) {
      break;
    }

    const openIndex = text.slice(atIndex).search(/[({]/);
    if (openIndex === -1) {
      break;
    }

    const bodyStart = atIndex + openIndex;
    const openChar = text[bodyStart];
    const closeChar = openChar === "{" ? "}" : ")";
    let depth = 0;
    let endIndex = -1;

    for (let cursor = bodyStart; cursor < text.length; cursor += 1) {
      if (text[cursor] === openChar) {
        depth += 1;
      } else if (text[cursor] === closeChar) {
        depth -= 1;
        if (depth === 0) {
          endIndex = cursor;
          break;
        }
      }
    }

    if (endIndex === -1) {
      break;
    }

    const type = text.slice(atIndex + 1, bodyStart).trim().toLowerCase();
    const body = text.slice(bodyStart + 1, endIndex);
    entries.push({ type, body });
    index = endIndex + 1;
  }

  return entries;
}

function parseBibFields(body: string) {
  const fields: Record<string, string> = {};
  let index = body.indexOf(",");

  if (index === -1) {
    return fields;
  }

  index += 1;

  while (index < body.length) {
    while (/[\s,]/.test(body[index] ?? "")) {
      index += 1;
    }

    const keyStart = index;
    while (/[A-Za-z0-9_-]/.test(body[index] ?? "")) {
      index += 1;
    }

    const key = body.slice(keyStart, index).trim().toLowerCase();
    if (!key) {
      index += 1;
      continue;
    }

    while (/\s/.test(body[index] ?? "")) {
      index += 1;
    }

    if (body[index] !== "=") {
      index += 1;
      continue;
    }

    index += 1;
    while (/\s/.test(body[index] ?? "")) {
      index += 1;
    }

    const start = index;
    const opener = body[index];
    let rawValue: string;

    if (opener === "{" || opener === '"') {
      const closer = opener === "{" ? "}" : '"';
      let depth = opener === "{" ? 1 : 0;
      index += 1;

      while (index < body.length) {
        const char = body[index];

        if (opener === "{" && char === "{") {
          depth += 1;
        } else if (char === closer) {
          if (opener === '"') {
            break;
          }

          depth -= 1;
          if (depth === 0) {
            break;
          }
        }

        index += 1;
      }

      rawValue = body.slice(start, Math.min(index + 1, body.length));
      index += 1;
    } else {
      while (index < body.length && body[index] !== ",") {
        index += 1;
      }

      rawValue = body.slice(start, index);
    }

    fields[key] = cleanValue(rawValue);
  }

  return fields;
}

function parseBibTeX(text: string) {
  return findBibEntries(text).map<ParsedReference>((entry) => {
    const fields = parseBibFields(entry.body);
    const doi = normalizeDoi(fields.doi);
    const venue = fields.journal || fields.booktitle || fields.publisher;
    const sourceType = bibTypeMap[entry.type] ?? (fields.url ? "website" : "other");

    return {
      title: fields.title,
      authors: formatAuthors(fields.author),
      year: getYear(fields.year || fields.date),
      sourceType,
      venue,
      publisher: fields.publisher,
      doi,
      url: fields.url,
      abstract: fields.abstract,
      keywords: splitKeywords(fields.keywords || fields.keyword),
    };
  });
}

function parseRisRecord(record: string) {
  const fields: Record<string, string[]> = {};
  let lastTag = "";

  record.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([A-Z0-9]{2})\s{2}-\s?(.*)$/);

    if (match) {
      const [, tag, value] = match;
      fields[tag] = [...(fields[tag] ?? []), cleanValue(value)];
      lastTag = tag;
      return;
    }

    if (lastTag && line.trim()) {
      const values = fields[lastTag] ?? [];
      const lastValue = values[values.length - 1] ?? "";
      fields[lastTag] = [...values.slice(0, -1), cleanValue(`${lastValue} ${line}`)];
    }
  });

  const first = (...tags: string[]) =>
    tags.flatMap((tag) => fields[tag] ?? []).find(Boolean);
  const type = first("TY") ?? "";
  const authors = [
    ...(fields.AU ?? []),
    ...(fields.A1 ?? []),
  ].filter(Boolean);
  const venue = first("JO", "JF", "JA", "T2", "PB");

  return {
    title: first("TI", "T1", "CT"),
    authors: authors.length > 0 ? authors.join("; ") : undefined,
    year: getYear(first("PY", "Y1", "DA")),
    sourceType: risTypeMap[type] ?? "other",
    venue,
    publisher: first("PB"),
    doi: normalizeDoi(first("DO")),
    url: first("UR", "L2"),
    abstract: first("AB", "N2"),
    keywords: Array.from(
      new Set([...(fields.KW ?? []), ...splitKeywords(first("DE"))].filter(Boolean))
    ),
  } satisfies ParsedReference;
}

function parseRis(text: string) {
  return text
    .split(/^ER\s{2}-.*$/m)
    .map((record) => record.trim())
    .filter(Boolean)
    .map(parseRisRecord);
}

function buildNotes(reference: ParsedReference) {
  return [
    reference.venue ? `Venue: ${reference.venue}` : "",
    reference.publisher && reference.publisher !== reference.venue
      ? `Publisher: ${reference.publisher}`
      : "",
    reference.doi ? `DOI: ${reference.doi}` : "",
    reference.abstract ? `Abstract: ${reference.abstract}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildExistingFingerprints(sources: ResearchLiteratureSource[]) {
  const dois = new Set<string>();
  const titleFingerprints = new Set<string>();

  sources.forEach((source) => {
    const doi = extractDoi(source.notes) ?? extractDoi(source.link);
    if (doi) {
      dois.add(doi);
    }

    const fingerprint = titleAuthorYearFingerprint(source);
    if (fingerprint.replace(/\|/g, "")) {
      titleFingerprints.add(fingerprint);
    }
  });

  return { dois, titleFingerprints };
}

export function prepareReferenceImport({
  text,
  format,
  projectId,
  existingSources,
}: PrepareReferenceImportOptions) {
  const parsedReferences = format === "bibtex" ? parseBibTeX(text) : parseRis(text);
  const existingFingerprints = buildExistingFingerprints(existingSources);
  const seenDois = new Set<string>();
  const seenTitleFingerprints = new Set<string>();
  let failedCount = 0;

  const candidates = parsedReferences.flatMap<ReferenceImportCandidate>(
    (reference, index) => {
      const title = normalizeWhitespace(reference.title ?? "");

      if (!title) {
        failedCount += 1;
        return [];
      }

      const doi = normalizeDoi(reference.doi);
      const titleFingerprint = titleAuthorYearFingerprint({
        ...reference,
        title,
      });
      const isDuplicateByDoi =
        Boolean(doi) &&
        (existingFingerprints.dois.has(doi ?? "") || seenDois.has(doi ?? ""));
      const isDuplicateByTitle =
        !isDuplicateByDoi &&
        Boolean(titleFingerprint.replace(/\|/g, "")) &&
        (existingFingerprints.titleFingerprints.has(titleFingerprint) ||
          seenTitleFingerprints.has(titleFingerprint));
      const duplicate = isDuplicateByDoi || isDuplicateByTitle;

      if (doi) {
        seenDois.add(doi);
      }

      if (titleFingerprint.replace(/\|/g, "")) {
        seenTitleFingerprints.add(titleFingerprint);
      }

      return [
        {
          id: `${format}-${index}-${titleFingerprint || doi || "reference"}`,
          source: {
            projectId,
            title,
            authors: reference.authors,
            year: reference.year,
            sourceType: reference.sourceType,
            status: "unread",
            link: reference.url || (doi ? `https://doi.org/${doi}` : undefined),
            themes: reference.keywords,
            keyQuote: undefined,
            notes: buildNotes({ ...reference, title, doi }) || undefined,
            pinned: false,
          },
          doi,
          venue: reference.venue,
          abstract: reference.abstract,
          duplicate,
          duplicateReason: duplicate
            ? isDuplicateByDoi
              ? "Matching DOI"
              : "Matching title, authors, and year"
            : undefined,
        },
      ];
    }
  );

  if (parsedReferences.length === 0 && text.trim()) {
    failedCount = 1;
  }

  return {
    candidates,
    failedCount,
  };
}
