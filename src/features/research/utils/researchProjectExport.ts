import type { ResearchResultBlock } from "../types";

export type ProjectPacketSection = {
  title: string;
  items: Array<{
    title: string;
    meta?: string;
    body?: string;
    resultBlocks?: ResearchResultBlock[];
  }>;
};

export type ProjectPacket = {
  title: string;
  description: string;
  exportedAt: string;
  summary: Array<{ label: string; value: string }>;
  sections: ProjectPacketSection[];
};

export function slugifyProjectFilename(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "research-project"
  );
}

export function downloadProjectTextFile(
  filename: string,
  content: string,
  type: string
) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeHtmlFragment(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function formatPacketListItem(item: ProjectPacketSection["items"][number]) {
  const lines = [`- ${item.title}`];

  if (item.meta) {
    lines.push(`  - ${item.meta}`);
  }

  if (item.body) {
    lines.push(`  - ${item.body}`);
  }

  item.resultBlocks?.forEach((block) => {
    if (block.title) {
      lines.push(`  - ${block.title}`);
    }

    if (block.type === "stata") {
      lines.push(
        `\n\`\`\`stata\n${block.text || block.plainText || ""}\n\`\`\``
      );
    } else if (block.type === "excel-table") {
      lines.push(`  - ${block.plainText || "Excel/table block"}`);
    } else if (block.type === "image") {
      lines.push(`  - Figure: ${block.caption || block.title || "PNG figure"}`);
    } else if (block.text || block.plainText) {
      lines.push(`  - ${block.text || block.plainText}`);
    }
  });

  return lines.join("\n");
}

function buildResultBlockHtml(block: ResearchResultBlock) {
  const title = block.title ? `<h4>${escapeHtml(block.title)}</h4>` : "";

  if (block.type === "stata") {
    return `${title}<pre class="stata-output">${escapeHtml(
      block.text || block.plainText || ""
    )}</pre>`;
  }

  if (block.type === "excel-table") {
    return `${title}<div class="table-output">${
      block.html
        ? sanitizeHtmlFragment(block.html)
        : `<pre>${escapeHtml(block.plainText || "")}</pre>`
    }</div>`;
  }

  if (block.type === "image" && block.imageDataUrl) {
    return `${title}<figure><img src="${block.imageDataUrl}" alt="${escapeHtml(
      block.caption || block.title || "Result figure"
    )}" />${
      block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""
    }</figure>`;
  }

  return `${title}<p>${escapeHtml(block.text || block.plainText || "")}</p>`;
}

export function buildProjectMarkdownPacket(packet: ProjectPacket) {
  const sections = packet.sections.map((section) => {
    const items =
      section.items.length > 0
        ? section.items.map(formatPacketListItem).join("\n")
        : "_No records yet._";

    return `## ${section.title}\n\n${items}`;
  });

  return [
    `# ${packet.title}`,
    packet.description,
    `Exported: ${packet.exportedAt}`,
    "## Command Center Summary",
    packet.summary.map((item) => `- ${item.label}: ${item.value}`).join("\n"),
    ...sections,
  ].join("\n\n");
}

export function buildProjectHtmlPacket(packet: ProjectPacket) {
  const summary = packet.summary
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(
          item.value
        )}</li>`
    )
    .join("");
  const sections = packet.sections
    .map((section) => {
      const items =
        section.items.length > 0
          ? section.items
              .map(
                (item) => `
                  <li>
                    <strong>${escapeHtml(item.title)}</strong>
                    ${item.meta ? `<div>${escapeHtml(item.meta)}</div>` : ""}
                    ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ""}
                    ${
                      item.resultBlocks?.length
                        ? `<div class="result-blocks">${item.resultBlocks
                            .map(buildResultBlockHtml)
                            .join("")}</div>`
                        : ""
                    }
                  </li>`
              )
              .join("")
          : "<li><em>No records yet.</em></li>";

      return `<section><h2>${escapeHtml(section.title)}</h2><ul>${items}</ul></section>`;
    })
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(packet.title)} Export</title>
    <style>
      body {
        font-family: Georgia, "Times New Roman", serif;
        color: #2f2437;
        line-height: 1.5;
        margin: 0;
        background: #fffaf5;
      }
      main {
        width: min(920px, calc(100% - 2rem));
        margin: 0 auto;
        padding: 2rem 0 3rem;
      }
      h1, h2 { color: #4d3575; }
      h1 { margin-bottom: 0.25rem; }
      section {
        break-inside: avoid;
        page-break-inside: avoid;
        margin-top: 1.6rem;
      }
      li { margin: 0.45rem 0; }
      p { margin: 0.25rem 0 0; }
      img { max-width: 100%; height: auto; }
      figure { margin: 1rem 0; }
      figcaption { color: #776a7f; font-size: 0.9rem; }
      .stata-output {
        overflow-x: auto;
        border: 1px solid #dbcdbf;
        border-radius: 8px;
        padding: 0.75rem;
        background: white;
        font-family: "Courier New", monospace;
        font-size: 8pt;
        white-space: pre;
      }
      .table-output {
        overflow-x: auto;
        margin-top: 0.6rem;
      }
      .table-output table {
        border-collapse: collapse;
        width: 100%;
      }
      .table-output td,
      .table-output th {
        border: 1px solid #dbcdbf;
        padding: 0.35rem 0.45rem;
      }
      .export-meta { color: #776a7f; }
      .print-toolbar {
        position: sticky;
        top: 0;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin: 0 0 1.5rem;
        padding: 0.8rem 1rem;
        border: 1px solid #dbcdbf;
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 8px 24px rgba(47, 36, 55, 0.12);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .print-toolbar p { margin: 0; color: #776a7f; }
      .print-toolbar button {
        border: 0;
        border-radius: 999px;
        padding: 0.7rem 1rem;
        background: #4d3575;
        color: white;
        cursor: pointer;
        font-weight: 800;
      }
      @media print {
        body { background: white; }
        main {
          width: auto;
          margin: 0;
          padding: 0;
        }
        .print-toolbar { display: none; }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="print-toolbar">
        <p>Use browser print to save this project packet as PDF.</p>
        <button type="button" onclick="window.print()">Print / Save as PDF</button>
      </div>

      <h1>${escapeHtml(packet.title)}</h1>
      <p>${escapeHtml(packet.description)}</p>
      <p class="export-meta">Exported: ${escapeHtml(packet.exportedAt)}</p>
      <section>
        <h2>Command Center Summary</h2>
        <ul>${summary}</ul>
      </section>
      ${sections}
    </main>
  </body>
</html>`;
}
