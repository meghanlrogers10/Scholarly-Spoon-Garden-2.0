import type { ResearchLiteratureSourceType } from "../types";

export type LiteratureMetadataResult = {
  title?: string;
  authors?: string;
  year?: string;
  containerTitle?: string;
  doi?: string;
  url?: string;
  sourceType: ResearchLiteratureSourceType;
};

type CrossrefWork = {
  title?: string[];
  author?: Array<{
    given?: string;
    family?: string;
    name?: string;
  }>;
  issued?: {
    "date-parts"?: number[][];
  };
  published?: {
    "date-parts"?: number[][];
  };
  "container-title"?: string[];
  publisher?: string;
  DOI?: string;
  URL?: string;
  type?: string;
};

type CrossrefSingleResponse = {
  message?: CrossrefWork;
};

type CrossrefSearchResponse = {
  message?: {
    items?: CrossrefWork[];
  };
};

const CROSSREF_BASE_URL = "https://api.crossref.org/works";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeDoi(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim();
}

function getYear(work: CrossrefWork) {
  return (
    work.issued?.["date-parts"]?.[0]?.[0]?.toString() ??
    work.published?.["date-parts"]?.[0]?.[0]?.toString()
  );
}

function formatAuthors(authors?: CrossrefWork["author"]) {
  if (!authors?.length) {
    return undefined;
  }

  return authors
    .map((author) => {
      if (author.name) {
        return author.name;
      }

      return [author.given, author.family].filter(Boolean).join(" ");
    })
    .map(normalizeWhitespace)
    .filter(Boolean)
    .join("; ");
}

function mapCrossrefType(type?: string): ResearchLiteratureSourceType {
  switch (type) {
    case "journal-article":
    case "proceedings-article":
      return "article";
    case "book":
    case "monograph":
    case "reference-book":
      return "book";
    case "book-chapter":
    case "book-section":
      return "chapter";
    case "report":
    case "report-component":
      return "report";
    case "dataset":
      return "dataset";
    default:
      return "other";
  }
}

function workToMetadata(work?: CrossrefWork): LiteratureMetadataResult | null {
  if (!work) {
    return null;
  }

  const title = work.title?.find(Boolean);

  if (!title) {
    return null;
  }

  return {
    title: normalizeWhitespace(title),
    authors: formatAuthors(work.author),
    year: getYear(work),
    containerTitle:
      work["container-title"]?.find(Boolean) ?? work.publisher ?? undefined,
    doi: work.DOI ? normalizeDoi(work.DOI) : undefined,
    url: work.URL,
    sourceType: mapCrossrefType(work.type),
  };
}

async function fetchCrossrefJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    throw new Error("Crossref lookup failed.");
  }

  return (await response.json()) as T;
}

export async function lookupLiteratureMetadataByDoi(doi: string) {
  const normalizedDoi = normalizeDoi(doi);

  if (!normalizedDoi) {
    return null;
  }

  const data = await fetchCrossrefJson<CrossrefSingleResponse>(
    `${CROSSREF_BASE_URL}/${encodeURIComponent(normalizedDoi)}`
  );

  return workToMetadata(data?.message);
}

export async function searchLiteratureMetadataByTitle(title: string) {
  const query = normalizeWhitespace(title);

  if (!query) {
    return null;
  }

  const params = new URLSearchParams({
    "query.bibliographic": query,
    rows: "1",
    sort: "relevance",
    order: "desc",
  });
  const data = await fetchCrossrefJson<CrossrefSearchResponse>(
    `${CROSSREF_BASE_URL}?${params.toString()}`
  );

  return workToMetadata(data?.message?.items?.[0]);
}
