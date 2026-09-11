import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { EditorPage } from "./pages/EditorPage";
import { FormsListPage } from "./pages/FormsListPage";
import { LandingPage } from "./pages/LandingPage";
import { PreviewPage } from "./pages/PreviewPage";
import { PublicFormPage } from "./pages/PublicFormPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { SubmissionsPage } from "./pages/SubmissionsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/f/:slug" element={<PublicFormPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/app" element={<FormsListPage />} />
          <Route path="/forms/:id" element={<EditorPage />} />
          <Route path="/forms/:id/preview" element={<PreviewPage />} />
          <Route path="/forms/:id/submissions" element={<SubmissionsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
