import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import { LowSpoonResourcesCard } from "../components/LowSpoonResourcesCard";
import { TeachingCourseSubnav } from "../components/TeachingCourseSubnav";
import { TeachingCourseSummaryStrip } from "../components/TeachingCourseSummaryStrip";
import { TeachingResourceGrid } from "../components/TeachingResourceGrid";
import { TeachingResourceModal } from "../components/TeachingResourceModal";
import { TeachingResourcesSummaryCards } from "../components/TeachingResourcesSummaryCards";
import { resourceTypeLabel, resourceTypeOptions } from "../components/resourceUtils";
import { useTeaching } from "../hooks/useTeaching";
import type {
  NewTeachingResourceInput,
  TeachingResource,
  TeachingResourceType,
} from "../types";
import { resourceTaskInput } from "../utils/teachingTaskBridge";
import "./teaching.css";

type ResourceSort = "updated" | "title" | "type";

function isRecentlyUpdated(resource: TeachingResource) {
  const updated = new Date(resource.updatedAt).getTime();
  return Number.isFinite(updated) && Date.now() - updated <= 7 * 86_400_000;
}

function sortResources(resources: TeachingResource[], sort: ResourceSort) {
  return [...resources].sort((a, b) => {
    if (sort === "title") {
      return (a.title || a.fileName || a.url).localeCompare(
        b.title || b.fileName || b.url
      );
    }

    if (sort === "type") {
      return resourceTypeLabel(a.resourceType).localeCompare(
        resourceTypeLabel(b.resourceType)
      );
    }

    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function markdownEscape(value: string) {
  return value.replaceAll("\r\n", "\n").trim();
}

function createMarkdown(
  courseCode: string,
  courseTitle: string,
  resources: TeachingResource[]
) {
  const lines = [
    `# ${courseCode}: ${courseTitle} Resources`,
    "",
    `Exported: ${new Date().toLocaleDateString()}`,
    "",
  ];

  resourceTypeOptions.forEach((type) => {
    const matchingResources = resources.filter(
      (resource) => resource.resourceType === type.value
    );

    if (matchingResources.length === 0) {
      return;
    }

    lines.push(`## ${type.label}`);
    lines.push("");
    matchingResources.forEach((resource) => {
      lines.push(`### ${resource.title || resource.fileName || resource.url || "Untitled resource"}`);
      lines.push("");
      lines.push(`Description: ${markdownEscape(resource.description) || "None"}`);
      lines.push(`URL: ${resource.url || "None"}`);
      lines.push(`Filename: ${resource.fileName || "None"}`);
      lines.push(`Created: ${resource.createdAt}`);
      lines.push(`Updated: ${resource.updatedAt}`);
      lines.push("");
    });
  });

  return lines.join("\n");
}

function downloadMarkdown(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function TeachingResourcesPage() {
  const { courseId } = useParams();
  const {
    getCourseById,
    getSemesterById,
    getResourcesForCourse,
    createResource,
    updateResource,
    deleteResource,
  } = useTeaching();
  const [searchTerm, setSearchTerm] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<
    TeachingResourceType | "all"
  >("all");
  const [sort, setSort] = useState<ResourceSort>("updated");
  const [editingResource, setEditingResource] = useState<TeachingResource>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addLinkedTaskToToday, isSourceOnToday } = useTaskBridge();

  const course = getCourseById(courseId);
  const semester = course ? getSemesterById(course.semesterId) : undefined;

  if (!course) {
    return (
      <section className="teaching-page page-stack">
        <div className="teaching-hero-panel">
          <div>
            <p className="eyebrow">Teaching</p>
            <h1>Course not found.</h1>
            <p>This course may have been archived, deleted, or not created yet.</p>
          </div>

          <Link className="teaching-secondary-button" to="/teaching">
            Back to Teaching
          </Link>
        </div>
      </section>
    );
  }

  const currentCourse = course;
  const resources = sortResources(getResourcesForCourse(currentCourse.id), sort);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredResources = resources.filter((resource) => {
    const matchesType =
      resourceTypeFilter === "all" || resource.resourceType === resourceTypeFilter;
    const haystack = [
      resource.title,
      resource.description,
      resource.url,
      resource.fileName,
    ]
      .join(" ")
      .toLowerCase();

    return matchesType && (!normalizedSearch || haystack.includes(normalizedSearch));
  });
  const externalLinkCount = resources.filter(
    (resource) => resource.resourceType === "external-link" || Boolean(resource.url)
  ).length;
  const summary = {
    total: resources.length,
    slides: resources.filter((resource) => resource.resourceType === "slides").length,
    assignmentRubric: resources.filter(
      (resource) =>
        resource.resourceType === "assignment" || resource.resourceType === "rubric"
    ).length,
    reading: resources.filter((resource) => resource.resourceType === "reading").length,
    externalLinks: externalLinkCount,
    recentlyUpdated: resources.filter(isRecentlyUpdated).length,
  };
  const hasSyllabusOrIcon = resources.some(
    (resource) =>
      resource.resourceType === "syllabus" ||
      resource.resourceType === "icon" ||
      resource.title.toLowerCase().includes("syllabus") ||
      resource.title.toLowerCase().includes("icon")
  );
  const reusableFaqResources = resources.filter(
    (resource) =>
      resource.reusable || resource.shortAnswer || resource.faqCategory,
  );

  function openAddModal() {
    setEditingResource(undefined);
    setIsModalOpen(true);
  }

  function handleSave(input: NewTeachingResourceInput) {
    if (editingResource) {
      updateResource(editingResource.id, input);
    } else {
      createResource(input);
    }

    setEditingResource(undefined);
    setIsModalOpen(false);
  }

  function handleDelete(resource: TeachingResource) {
    const label = resource.title || resource.fileName || resource.url || "this resource";

    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      deleteResource(resource.id);
    }
  }

  function handleExport() {
    downloadMarkdown(
      `${currentCourse.code || "course"}-resources.md`,
      createMarkdown(currentCourse.code, currentCourse.title, resources)
    );
  }

  function handleAddResourceToToday(resource: TeachingResource) {
    addLinkedTaskToToday(resourceTaskInput(currentCourse, resource));
  }

  return (
    <section className="teaching-page page-stack">
      <div className="teaching-hero-panel">
        <div>
          <Link className="teaching-secondary-link" to={`/teaching/${currentCourse.id}`}>
            Back to {currentCourse.code}
          </Link>

          <p className="eyebrow">
            {semester ? `${semester.term} ${semester.year}` : "Teaching"} ·
            Resources
          </p>

          <h1>{currentCourse.code}: Resources</h1>

          <p>
            Course materials, links, filenames, and resource notes so future-you
            can find the right thing without spelunking.
          </p>
        </div>

        <div className="teaching-course-hero__status">
          <span>Course</span>
          <strong>{currentCourse.title}</strong>

          <span>Resources</span>
          <strong>{resources.length}</strong>
        </div>
      </div>

      <TeachingCourseSubnav courseId={currentCourse.id} />
      <TeachingCourseSummaryStrip courseId={currentCourse.id} />

      <div className="teaching-notebook-toolbar">
        <div>
          <p className="eyebrow">Resources</p>
          <h2>Course materials</h2>
        </div>
        <div className="teaching-hero-panel__actions">
          <button
            className="teaching-secondary-button"
            type="button"
            onClick={handleExport}
            disabled={resources.length === 0}
          >
            Export Resource List
          </button>
          <button className="teaching-primary-button" type="button" onClick={openAddModal}>
            Add Resource
          </button>
        </div>
      </div>

      <div className="teaching-notebook-grid">
        <div className="teaching-notebook-panel">
          <div className="teaching-panel-heading">
            <p className="eyebrow">Resources Summary</p>
            <h3>Material shape</h3>
          </div>
          <TeachingResourcesSummaryCards {...summary} />
        </div>
        <LowSpoonResourcesCard
          resources={resources}
          hasSyllabusOrIcon={hasSyllabusOrIcon}
        />
      </div>

      <aside className="teaching-notebook-panel">
        <div className="teaching-panel-heading">
          <p className="eyebrow">FAQ / resource packet</p>
          <h3>Reusable student-facing answers</h3>
        </div>
        <div className="teaching-change-list">
          {reusableFaqResources.slice(0, 5).map((resource) => (
            <article key={resource.id}>
              <span>{resource.faqCategory || resourceTypeLabel(resource.resourceType)}</span>
              <strong>
                {resource.title || resource.fileName || resource.url || "Untitled resource"}
              </strong>
              <p>{resource.shortAnswer || resource.description || "No short answer yet."}</p>
              <div className="teaching-table-actions">
                <button
                  className="teaching-chip-button"
                  type="button"
                  onClick={() => handleAddResourceToToday(resource)}
                  disabled={isSourceOnToday("resource", resource.id)}
                >
                  {isSourceOnToday("resource", resource.id)
                    ? "Added to Today"
                    : "Add to Today"}
                </button>
                <button
                  className="teaching-chip-button"
                  type="button"
                  onClick={() => {
                    setEditingResource(resource);
                    setIsModalOpen(true);
                  }}
                >
                  Edit
                </button>
              </div>
            </article>
          ))}
          {reusableFaqResources.length === 0 ? (
            <p className="teaching-muted-copy">
              No reusable FAQ resources yet. Mark a resource reusable or add a
              short answer when a question keeps returning.
            </p>
          ) : null}
        </div>
      </aside>

      <div className="teaching-prep-controls">
        <div className="teaching-filter-group">
          <button
            className="teaching-chip-button"
            type="button"
            aria-pressed={resourceTypeFilter === "all"}
            onClick={() => setResourceTypeFilter("all")}
          >
            All types
          </button>
          {resourceTypeOptions.map((option) => (
            <button
              key={option.value}
              className="teaching-chip-button"
              type="button"
              aria-pressed={resourceTypeFilter === option.value}
              onClick={() => setResourceTypeFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label>
          <span className="eyebrow">Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as ResourceSort)}>
            <option value="updated">Updated</option>
            <option value="title">Title</option>
            <option value="type">Resource type</option>
          </select>
        </label>

        <label>
          <span className="eyebrow">Search resources</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Title, description, URL, or filename"
          />
        </label>
      </div>

      <TeachingResourceGrid
        resources={filteredResources}
        onAddResource={openAddModal}
        onEditResource={(resource) => {
          setEditingResource(resource);
          setIsModalOpen(true);
        }}
        onDeleteResource={handleDelete}
        onAddToToday={handleAddResourceToToday}
        isOnToday={(resource) => isSourceOnToday("resource", resource.id)}
      />

      {isModalOpen ? (
        <TeachingResourceModal
          courseId={currentCourse.id}
          resource={editingResource}
          onClose={() => {
            setEditingResource(undefined);
            setIsModalOpen(false);
          }}
          onSave={handleSave}
        />
      ) : null}
    </section>
  );
}
