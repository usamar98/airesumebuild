import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Home from "@/pages/Home";
import ResumeBuilder from "@/pages/ResumeBuilder";
import ResumeAnalyzer from "@/pages/ResumeAnalyzer";
import Templates from "@/pages/Templates";
import CoverLetter from "@/pages/CoverLetter";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import AdminDashboard from "@/pages/AdminDashboard";
import ResumeUploader from "@/components/ResumeUploader";
import { createDefaultAdminUser } from "@/utils/adminSetup";
import { useLanguage } from "@/hooks/useLanguage";
import "@/i18n";

export default function App() {
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';

  // Initialize admin user on app startup
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        await createDefaultAdminUser();
      } catch (error) {
        console.error('Failed to initialize admin user:', error);
      }
    };
    
    initializeAdmin();
  }, []);

  // Set document direction based on language
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [isRTL, currentLanguage]);

  return (
    <ErrorBoundary>
      <SupabaseAuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/update-resume" element={
            <ProtectedRoute requireEmailVerification={false}>
              <ResumeUploader />
            </ProtectedRoute>
          } />
          <Route path="/resume-builder" element={
            <ProtectedRoute requireEmailVerification={false}>
              <ResumeBuilder />
            </ProtectedRoute>
          } />
          <Route path="/builder" element={
            <ProtectedRoute requireEmailVerification={false}>
              <ResumeBuilder />
            </ProtectedRoute>
          } />
          <Route path="/resume-analyzer" element={
            <ProtectedRoute requireEmailVerification={false}>
              <ResumeAnalyzer />
            </ProtectedRoute>
          } />
          <Route path="/analyzer" element={
            <ProtectedRoute requireEmailVerification={false}>
              <ResumeAnalyzer />
            </ProtectedRoute>
          } />
          <Route path="/templates" element={
            <ProtectedRoute requireEmailVerification={false}>
              <Templates />
            </ProtectedRoute>
          } />
          <Route path="/cover-letter" element={
            <ProtectedRoute requireEmailVerification={false}>
              <CoverLetter />
            </ProtectedRoute>
          } />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </SupabaseAuthProvider>
    </ErrorBoundary>
  );
}
