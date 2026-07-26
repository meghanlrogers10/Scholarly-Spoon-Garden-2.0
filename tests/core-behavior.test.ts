import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getAppDisplayName,
  getEmailDisplayName,
  normalizePreferredName,
} from "../src/shared/auth/displayName.ts";
import {
  CLOUD_SAVE_ORDER,
  type CloudSaveArea,
} from "../src/shared/sync/cloudSaveTypes.ts";
import {
  mergeResearchDataForSync,
  type ResearchCloudSnapshot,
} from "../src/shared/firebase/researchCloudService.ts";
import {
  shouldIsolateLocalDataForUserSwitch,
} from "../src/shared/sync/userLocalData.ts";
import {
  clearLocalDashboardTasksData,
  clearLocalResearchTeachingServiceData,
  collectDashboardTasksCleanupSummary,
  collectSampleDataCleanupSummary,
  isIdentifiedSeedRecord,
} from "../src/shared/utils/sampleDataCleanup.ts";
import {
  APP_STORAGE_KEYS,
  createBackupFilename,
  downloadBackup,
  type AppBackup,
} from "../src/shared/utils/appBackup.ts";
import {
  RESEARCH_PERMANENTLY_DELETED_PROJECT_IDS_STORAGE_KEY,
  RESEARCH_PROJECTS_STORAGE_KEY,
} from "../src/shared/constants/researchStorage.ts";
import { MINDSPACE_ITEMS_STORAGE_KEY } from "../src/shared/constants/mindspaceStorage.ts";
import { APP_SETTINGS_STORAGE_KEY } from "../src/shared/constants/settingsStorage.ts";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

class MemoryLocalStorage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

function installBrowserStubs() {
  const localStorage = new MemoryLocalStorage();

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage,
      dispatchEvent: () => true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorage,
  });
  Object.defineProperty(globalThis, "CustomEvent", {
    configurable: true,
    value: class CustomEvent<T> extends Event {
      detail: T;

      constructor(type: string, init?: { detail?: T }) {
        super(type);
        this.detail = init?.detail as T;
      }
    },
  });
}

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function emptyResearchSnapshot(): ResearchCloudSnapshot {
  return {
    projects: [],
    tasks: [],
    logEntries: [],
    drafts: [],
    submissions: [],
    literatureSources: [],
    literatureNotes: [],
    readingNotes: [],
    mindMapNodes: [],
    mindMapEdges: [],
    synthesisSections: [],
    prismaRecords: [],
    prismaCriteria: [],
  };
}

beforeEach(() => {
  installBrowserStubs();
});

describe("preferred name display", () => {
  it("trims the preferred name and prevents blanks from replacing fallbacks", () => {
    assert.equal(normalizePreferredName("  Meg  "), "Meg");
    assert.equal(normalizePreferredName("   "), undefined);
  });

  it("uses preferred name, Firebase displayName, then email fallback", () => {
    assert.equal(
      getAppDisplayName(
        { displayName: "Meghan Rogers", email: "meghan@example.com" },
        "  Meg  ",
      ),
      "Meg",
    );
    assert.equal(
      getAppDisplayName(
        { displayName: "Meghan Rogers", email: "meghan@example.com" },
        "",
      ),
      "Meghan Rogers",
    );
    assert.equal(
      getAppDisplayName({ displayName: "", email: "meghan.rogers@example.com" }),
      "Meghan Rogers",
    );
    assert.equal(getEmailDisplayName(undefined), "Signed in");
  });
});

describe("production demo and seed cleanup", () => {
  it("does not leave old production sample fixture modules or dashboard sample rendering", () => {
    [
      "src/shared/data/sampleDashboard.ts",
      "src/features/research/data/sampleResearchProjects.ts",
      "src/features/service/data/sampleService.ts",
      "src/features/mindspace/data/sampleMindspace.ts",
    ].forEach((relativePath) => {
      assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), false);
    });

    const dashboardSource = readSource("src/features/dashboard/DashboardPage.tsx");

    assert.equal(dashboardSource.includes("sampleCalendarItems"), false);
    assert.equal(dashboardSource.includes("showSampleCalendarEvents ?"), false);
  });

  it("identifies only explicit demo metadata or known deterministic seed IDs", () => {
    assert.equal(
      isIdentifiedSeedRecord(RESEARCH_PROJECTS_STORAGE_KEY, {
        id: "scd-paper",
        title: "Old seeded research project",
      }),
      true,
    );
    assert.equal(
      isIdentifiedSeedRecord(RESEARCH_PROJECTS_STORAGE_KEY, {
        id: "real-project",
        title: "User project",
      }),
      false,
    );
    assert.equal(
      isIdentifiedSeedRecord(MINDSPACE_ITEMS_STORAGE_KEY, {
        id: "anything",
        isDemo: true,
      }),
      true,
    );
  });

  it("filters confirmed seed records without deleting real records", () => {
    window.localStorage.setItem(
      RESEARCH_PROJECTS_STORAGE_KEY,
      JSON.stringify([
        { id: "scd-paper", title: "Seeded" },
        { id: "real-project", title: "Real work" },
      ]),
    );
    window.localStorage.setItem(
      MINDSPACE_ITEMS_STORAGE_KEY,
      JSON.stringify([
        { id: "mind-1", title: "Seeded" },
        { id: "real-mind", title: "Real thought" },
      ]),
    );

    const summary = collectSampleDataCleanupSummary();
    assert.equal(summary.recordCount, 2);

    clearLocalResearchTeachingServiceData();

    assert.deepEqual(
      JSON.parse(window.localStorage.getItem(RESEARCH_PROJECTS_STORAGE_KEY) ?? "[]"),
      [{ id: "real-project", title: "Real work" }],
    );
    assert.deepEqual(
      JSON.parse(window.localStorage.getItem(MINDSPACE_ITEMS_STORAGE_KEY) ?? "[]"),
      [{ id: "real-mind", title: "Real thought" }],
    );
  });

  it("only clears known dashboard/task seed records and disables old sample calendar setting", () => {
    window.localStorage.setItem(
      "ssg2.todayTasks",
      JSON.stringify([
        { id: "task-1", title: "Seeded task" },
        { id: "real-task", title: "Real task" },
      ]),
    );
    window.localStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify({ showSampleCalendarEvents: true }),
    );

    const summary = collectDashboardTasksCleanupSummary();
    assert.equal(summary.recordCount, 2);

    clearLocalDashboardTasksData();

    assert.deepEqual(
      JSON.parse(window.localStorage.getItem("ssg2.todayTasks") ?? "[]"),
      [{ id: "real-task", title: "Real task" }],
    );
    assert.equal(
      JSON.parse(window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY) ?? "{}")
        .showSampleCalendarEvents,
      false,
    );
  });
});

describe("cloud save coverage and isolation", () => {
  it("registers every major data area for automatic cloud save", () => {
    const expectedAreas: CloudSaveArea[] = [
      "settings",
      "tasks",
      "planning",
      "timer",
      "mindspace",
      "service",
      "teaching",
      "research",
    ];

    assert.deepEqual(CLOUD_SAVE_ORDER, expectedAreas);
  });

  it("backs up local fallback keys for every major data category", () => {
    const categories = new Set(APP_STORAGE_KEYS.map((definition) => definition.category));

    [
      "settings",
      "shared-tasks",
      "dashboard",
      "timer",
      "mindspace",
      "service",
      "teaching",
      "research",
    ].forEach((category) => assert.equal(categories.has(category as never), true));
  });

  it("backs up permanent Research deletion tombstones", () => {
    assert.equal(
      APP_STORAGE_KEYS.some(
        (definition) =>
          definition.key === RESEARCH_PERMANENTLY_DELETED_PROJECT_IDS_STORAGE_KEY,
      ),
      true,
    );
  });

  it("keeps permanently deleted Research projects out of cloud merges", () => {
    const localSnapshot = emptyResearchSnapshot();
    const cloudSnapshot = emptyResearchSnapshot();

    cloudSnapshot.projects = [
      {
        id: "project-gone",
        title: "Gone project",
        shortName: "Gone",
        description: "Should stay deleted",
        focusLevel: "paused",
        status: "deleted",
        currentStage: "lit-framing",
        nextAction: "None",
        updatedAt: "2026-07-01",
        color: "purple",
        taskCount: 1,
        completedTaskCount: 0,
        literatureCount: 1,
        notesCount: 0,
      },
    ];
    cloudSnapshot.tasks = [
      {
        id: "task-gone",
        projectId: "project-gone",
        title: "Old task",
        stageKey: "lit-framing",
        status: "todo",
        priority: "medium",
        spoonCost: 2,
        createdAt: "2026-07-01",
        updatedAt: "2026-07-01",
      },
    ];
    cloudSnapshot.literatureSources = [
      {
        id: "source-gone",
        projectId: "project-gone",
        title: "Old source",
        authors: "Someone",
        year: "2026",
        status: "queued",
        tags: [],
        createdAt: "2026-07-01",
        updatedAt: "2026-07-01",
      },
    ];

    const mergeResult = mergeResearchDataForSync(localSnapshot, cloudSnapshot, {
      permanentlyDeletedProjectIds: ["project-gone"],
    });

    assert.deepEqual(mergeResult.projects, []);
    assert.deepEqual(mergeResult.tasks, []);
    assert.deepEqual(mergeResult.literatureSources, []);
    assert.deepEqual(mergeResult.permanentDeletionTargets.projectIds, [
      "project-gone",
    ]);
    assert.deepEqual(mergeResult.permanentDeletionTargets.taskIds, [
      "task-gone",
    ]);
    assert.deepEqual(mergeResult.permanentDeletionTargets.literatureSourceIds, [
      "source-gone",
    ]);
  });

  it("isolates local data only when a different signed-in user takes over", () => {
    assert.equal(shouldIsolateLocalDataForUserSwitch(null, "user-a"), false);
    assert.equal(shouldIsolateLocalDataForUserSwitch("user-a", "user-a"), false);
    assert.equal(shouldIsolateLocalDataForUserSwitch("user-a", "user-b"), true);
  });
});

describe("settings and backup interactions", () => {
  it("keeps advanced restore content collapsed on the primary settings page", () => {
    const settingsSource = readSource("src/features/settings/pages/SettingsPage.tsx");

    assert.equal(settingsSource.includes("Preferred name"), true);
    assert.equal(settingsSource.includes("Restore or advanced options"), true);
    assert.equal(settingsSource.includes("<CloudSaveControl"), false);
    assert.equal(settingsSource.includes("Show sample calendar events"), false);
  });

  it("creates dated backup filenames and downloads only when the download helper is called", () => {
    assert.match(
      createBackupFilename("scholarly-spoon-garden-test"),
      /^scholarly-spoon-garden-test-\d{4}-\d{2}-\d{2}\.json$/,
    );

    const clickedDownloads: string[] = [];

    Object.defineProperty(globalThis, "URL", {
      configurable: true,
      value: {
        createObjectURL: () => "blob:test",
        revokeObjectURL: () => undefined,
      },
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: () => ({
          href: "",
          download: "",
          click() {
            clickedDownloads.push(this.download);
          },
        }),
      },
    });

    const backup: AppBackup = {
      appName: "Scholarly Spoon Garden 2",
      backupVersion: 1,
      exportedAt: new Date().toISOString(),
      keyCount: 0,
      entries: [],
      warnings: [],
    };

    assert.deepEqual(clickedDownloads, []);
    downloadBackup(backup, "manual-backup.json");
    assert.deepEqual(clickedDownloads, ["manual-backup.json"]);
  });
});
