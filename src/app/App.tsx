import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { AuthProvider } from "../shared/auth/AuthProvider";
import { useAuthUser } from "../shared/auth/useAuthUser";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { TasksPage } from "../features/tasks/pages/TasksPage";
import { ResearchPage } from "../features/research/pages/ResearchPage";
import { TeachingPage } from "../features/teaching/pages/TeachingPage";
import { ServicePage } from "../features/service/pages/ServicePage";
import { CommitteePage } from "../features/service/pages/CommitteePage";
import { AdvisingPage } from "../features/service/pages/AdvisingPage";
import { AdvisingStudentPage } from "../features/service/pages/AdvisingStudentPage";
import {
  ReviewsLettersPage,
  ServiceAdminPage,
} from "../features/service/pages/ServiceToolPlaceholderPage";
import { MindspacePage } from "../features/mindspace/pages/MindspacePage";
import { TimerLogPage } from "../features/timer/pages/TimerLogPage";
import { SettingsPage } from "../features/settings/pages/SettingsPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { ResearchTasksPage } from "../features/research/pages/ResearchTasksPage";
import { ResearchStagesPage } from "../features/research/pages/ResearchStagesPage";
import { ResearchProjectPage } from "../features/research/pages/ResearchProjectPage";
import { ResearchLogPage } from "../features/research/pages/ResearchLogPage";
import { ResearchDraftsPage } from "../features/research/pages/ResearchDraftsPage";
import { ResearchSubmissionsPage } from "../features/research/pages/ResearchSubmissionsPage";
import { ResearchLiteraturePage } from "../features/research/pages/ResearchLiteraturePage";
import { TeachingCoursePage } from "../features/teaching/pages/TeachingCoursePage";
import { TeachingNotebookPage } from "../features/teaching/pages/TeachingNotebookPage";
import { ClassPrepPage } from "../features/teaching/pages/ClassPrepPage";
import { GradingPage } from "../features/teaching/pages/GradingPage";
import { TaFollowUpPage } from "../features/teaching/pages/TaFollowUpPage";
import { TeachingAnnouncementsPage } from "../features/teaching/pages/TeachingAnnouncementsPage";
import { OfficeHoursPage } from "../features/teaching/pages/OfficeHoursPage";
import { CourseNotesPage } from "../features/teaching/pages/CourseNotesPage";
import { TeachingResourcesPage } from "../features/teaching/pages/TeachingResourcesPage";
import { CloudSaveAgent } from "../shared/sync/CloudSaveAgent";

function AuthLoadingScreen() {
  return (
    <main className="auth-loading-screen">
      <div className="garden-card">
        <p className="eyebrow">Account</p>
        <h1>Checking your sign-in...</h1>
        <p className="muted-text">
          Scholarly Spoon Garden is finding the right workspace for you.
        </p>
      </div>
    </main>
  );
}

function RootRedirect() {
  const { user, loading } = useAuthUser();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

function LoginRoute() {
  const { user, loading } = useAuthUser();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}

function ProtectedLayout() {
  const { user, loading } = useAuthUser();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <AppShell>
      <CloudSaveAgent />
      <Outlet />
    </AppShell>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginRoute />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/research/:projectId" element={<ResearchProjectPage />} />
            <Route path="/research/:projectId/tasks" element={<ResearchTasksPage />} />
            <Route path="/research/:projectId/stages" element={<ResearchStagesPage />} />
            <Route
              path="/research/:projectId/literature"
              element={<ResearchLiteraturePage />}
            />
            <Route path="/research/:projectId/notes" element={<ResearchLogPage />} />
            <Route
              path="/research/:projectId/drafts"
              element={<ResearchDraftsPage />}
            />
            <Route
              path="/research/:projectId/journals"
              element={<ResearchSubmissionsPage />}
            />

            <Route path="/teaching" element={<TeachingPage />} />
            <Route path="/teaching/:courseId" element={<TeachingCoursePage />} />
            <Route
              path="/teaching/:courseId/notebook"
              element={<TeachingNotebookPage />}
            />
            <Route path="/teaching/:courseId/class-prep" element={<ClassPrepPage />} />
            <Route path="/teaching/:courseId/grading" element={<GradingPage />} />
            <Route
              path="/teaching/:courseId/office-hours"
              element={<OfficeHoursPage />}
            />
            <Route path="/teaching/:courseId/ta" element={<TaFollowUpPage />} />
            <Route
              path="/teaching/:courseId/announcements"
              element={<TeachingAnnouncementsPage />}
            />
            <Route path="/teaching/:courseId/notes" element={<CourseNotesPage />} />
            <Route
              path="/teaching/:courseId/resources"
              element={<TeachingResourcesPage />}
            />
            <Route path="/service" element={<ServicePage />} />
            <Route
              path="/service/committees/:committeeId"
              element={<CommitteePage />}
            />
            <Route path="/service/advising" element={<AdvisingPage />} />
            <Route
              path="/service/advising/:studentId"
              element={<AdvisingStudentPage />}
            />
            <Route path="/service/reviews" element={<ReviewsLettersPage />} />
            <Route path="/service/admin" element={<ServiceAdminPage />} />
            <Route path="/mindspace" element={<MindspacePage />} />
            <Route path="/timer-log" element={<TimerLogPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
