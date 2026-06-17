import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ProjectEditModal } from "../components/ProjectEditModal";
import { ProjectWizardModal } from "../components/ProjectWizardModal";
import { ResearchProjectGrid } from "../components/ResearchProjectGrid";
import { useResearchLiterature } from "../hooks/useResearchLiterature";
import { useResearchLiteratureNotes } from "../hooks/useResearchLiteratureNotes";
import { useResearchLiteratureReadingNotes } from "../hooks/useResearchLiteratureReadingNotes";
import { useResearchProjects } from "../hooks/useResearchProjects";
import { useResearchTasks } from "../hooks/useResearchTasks";
import type { NewResearchProjectInput, ResearchProject } from "../types";
import "./research.css";

export function ResearchPage() {
  const [isProjectWizardOpen, setIsProjectWizardOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ResearchProject | null>(
    null
  );

  const location = useLocation();
  const {
    activeProjects,
    archivedProjects,
    deletedProjects,
    sortMode,
    setSortMode,
    addProject,
    updateProject,
    updateProjectFocus,
    archiveProject,
    deleteProject,
    restoreProject,
    permanentlyDeleteProject,
  } = useResearchProjects();

  const {
    createPipelineTasksForProject,
    getTasksForProject,
    refreshTasks,
  } = useResearchTasks();
  const { getSourcesForProject, refreshSources } = useResearchLiterature();
  const { getNotesForProject, refreshNotes } = useResearchLiteratureNotes();
  const { getReadingNotesForProject, refreshReadingNotes } =
    useResearchLiteratureReadingNotes();

  useEffect(() => {
    refreshTasks();
    refreshSources();
    refreshNotes();
    refreshReadingNotes();
  // Refresh localStorage-backed research overview data only on route transitions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  function handleCreateProject(input: NewResearchProjectInput) {
    const project = addProject(input);
    createPipelineTasksForProject(project);
  }

  function addTaskStatsToProjects(projects: ResearchProject[]) {
    return projects.map((project) => {
      const projectTasks = getTasksForProject(project.id);
      const completedTasks = projectTasks.filter(
        (task) => task.status === "done"
      );
      const nextOpenTask = projectTasks.find((task) => task.status !== "done");

      return {
        ...project,
        taskCount: projectTasks.length,
        completedTaskCount: completedTasks.length,
        literatureCount: getSourcesForProject(project.id).length,
        notesCount:
          getNotesForProject(project.id).length +
          getReadingNotesForProject(project.id).length,
        nextAction:
          nextOpenTask?.title ??
          "All listed tasks are done. Choose the next concrete move.",
      };
    });
  }

  const activeProjectsWithTaskStats = addTaskStatsToProjects(activeProjects);
  const archivedProjectsWithTaskStats = addTaskStatsToProjects(archivedProjects);
  const deletedProjectsWithTaskStats = addTaskStatsToProjects(deletedProjects);

  return (
    <section className="research-page page-stack">
      <div className="research-hero-panel">
        <div>
          <p className="eyebrow">Research</p>
          <h1>Your manuscript garden.</h1>
          <p>
            Projects, stages, literature, research logs, drafts, and submissions
            live here. The goal is simple: know what matters next without
            reopening every project in your head.
          </p>
        </div>

        <div className="research-hero-panel__actions">
          <button
            className="research-primary-button"
            type="button"
            onClick={() => setIsProjectWizardOpen(true)}
          >
            + New Project
          </button>

          <label className="research-sort-control">
            <span>Sort</span>
            <select
              value={sortMode}
              onChange={(event) =>
                setSortMode(event.target.value as "updated" | "title" | "focus")
              }
            >
              <option value="focus">Focus level</option>
              <option value="updated">Recently updated</option>
              <option value="title">A–Z</option>
            </select>
          </label>
        </div>
      </div>

      <div className="research-focus-note">
        <strong>Research rule:</strong> primary gets urgency, secondary gets
        visibility, paused gets peace. Paused is not failure. It is bandwidth
        management.
      </div>

      <ResearchProjectGrid
        title="Active projects"
        projects={activeProjectsWithTaskStats}
        emptyMessage="No active projects yet. Add one project, not twelve."
        onUpdateFocus={updateProjectFocus}
        onEditProject={setEditingProject}
        onArchiveProject={archiveProject}
        onDeleteProject={deleteProject}
      />

      <ResearchProjectGrid
        title="Archived projects"
        projects={archivedProjectsWithTaskStats}
        emptyMessage="Nothing archived yet."
        onEditProject={setEditingProject}
        onRestoreProject={restoreProject}
        onDeleteProject={deleteProject}
      />

      <ResearchProjectGrid
        title="Recently deleted"
        projects={deletedProjectsWithTaskStats}
        emptyMessage="No deleted projects."
        onRestoreProject={restoreProject}
        onPermanentlyDeleteProject={permanentlyDeleteProject}
      />

      {isProjectWizardOpen ? (
        <ProjectWizardModal
          onClose={() => setIsProjectWizardOpen(false)}
          onCreateProject={handleCreateProject}
        />
      ) : null}

      {editingProject ? (
        <ProjectEditModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaveProject={updateProject}
        />
      ) : null}
    </section>
  );
}
