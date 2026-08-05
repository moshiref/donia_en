import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";

// Old pages (keep for backward compatibility)
import WelcomePage from "../pages/WelcomePage";
import LevelsPage from "../pages/LevelsPage";
import GradeSelectPage from "../pages/GradeSelectPage";
import ExamEntryPage from "../pages/ExamEntryPage";
import ExamStartPlaceholderPage from "../pages/ExamStartPlaceholderPage";

// Admin pages
import AdminLoginPage from "../pages/admin/AdminLoginPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminExamsPage from "../pages/admin/AdminExamsPage";
import AdminExamFormPage from "../pages/admin/AdminExamFormPage";
import AdminExamPreviewPage from "../pages/admin/AdminExamPreviewPage";
import AdminResultsPage from "../pages/admin/AdminResultsPage";
import AdminResultDetailPage from "../pages/admin/AdminResultDetailPage";
import AdminTopStudentsPage from "../pages/admin/AdminTopStudentsPage";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";

// Student pages
import StudentHomePage from "../pages/student/StudentHomePage";
import StudentExamsPage from "../pages/student/StudentExamsPage";
import StudentExamStartPage from "../pages/student/StudentExamStartPage";
import StudentExamTakePage from "../pages/student/StudentExamTakePage";
import StudentExamResultPage from "../pages/student/StudentExamResultPage";

export default function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        {/* Student Routes (Public) */}
        <Route path="/" element={<StudentHomePage />} />
        <Route path="/exams/:stageId/:gradeId" element={<StudentExamsPage />} />
        <Route path="/exam/:examId/start" element={<StudentExamStartPage />} />
        <Route path="/exam/:examId/take/:attemptId" element={<StudentExamTakePage />} />
        <Route path="/exam/:examId/result/:attemptId" element={<StudentExamResultPage />} />

        {/* Admin Login (Public) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin Routes (Protected) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="exams" element={<AdminExamsPage />} />
          <Route path="exams/new" element={<AdminExamFormPage />} />
          <Route path="exams/:id/edit" element={<AdminExamFormPage />} />
          <Route path="exams/:id/preview" element={<AdminExamPreviewPage />} />
          <Route path="results" element={<AdminResultsPage />} />
          <Route path="results/:id" element={<AdminResultDetailPage />} />
          <Route path="top-students" element={<AdminTopStudentsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Old Routes (backward compatibility) */}
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/levels" element={<LevelsPage />} />
        <Route path="/levels/:stage" element={<GradeSelectPage />} />
        <Route path="/old-exam/:stage" element={<ExamEntryPage />} />
        <Route path="/old-exam/:stage/start" element={<ExamStartPlaceholderPage />} />
      </Routes>
    </AuthProvider>
  );
}
