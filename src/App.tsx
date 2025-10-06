import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Home from "@/pages/Home";
import ResumeBuilder from "@/pages/ResumeBuilder";
import ResumeAnalyzer from "@/pages/ResumeAnalyzer";
import Templates from "@/pages/Templates";
import CoverLetter from "@/pages/CoverLetter";
import UpworkProposal from "@/pages/UpworkProposal";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import AdminDashboard from "@/pages/AdminDashboard";
// TEMPORARILY DISABLED FOR RAILWAY DEPLOYMENT - Job-related imports
// import JobDashboard from '@/pages/JobDashboard';
// import JobDetails from '@/pages/JobDetails';
// import SavedJobs from '@/pages/SavedJobs';
// import PostJob from '@/pages/PostJob';
// import JobApplication from '@/pages/JobApplication';
// import EmployerDashboard from '@/pages/EmployerDashboard';
// import ApplicantDashboard from './pages/ApplicantDashboard';
import AIAssistantHub from './pages/AIAssistantHub';
import ResumeUploader from "@/components/ResumeUploader";
// import JobsHub from "@/components/JobsHub";
import SmartDashboard from "@/components/SmartDashboard";
// import CompanyProfileDashboard from "@/pages/CompanyProfileDashboard";
// import CompanyAnalyticsDashboard from "@/pages/CompanyAnalyticsDashboard";
// import CompanyJobsDashboard from "@/pages/CompanyJobsDashboard";
// import JobSeekerOverviewDashboard from "@/pages/JobSeekerOverviewDashboard";
// import JobSeekerApplicationsDashboard from "@/pages/JobSeekerApplicationsDashboard";
// import JobSeekerProfileDashboard from "@/pages/JobSeekerProfileDashboard";
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
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* TEMPORARILY DISABLED FOR RAILWAY DEPLOYMENT - Job-related features */}
            {/* Jobs Hub - Unified job browsing, posting, and management */}
            {/* <Route path="/jobs-hub" element={
              <ProtectedRoute>
                <JobsHub />
              </ProtectedRoute>
            } /> */}
            
            {/* Legacy job routes - redirect to Jobs Hub */}
            {/* <Route path="/jobs" element={<Navigate to="/jobs-hub?view=browse" replace />} />
            <Route path="/post-job" element={<Navigate to="/jobs-hub?view=post" replace />} />
            <Route path="/saved-jobs" element={<Navigate to="/jobs-hub?view=saved" replace />} /> */}
            
            {/* Job Details and Application - Keep separate for specific functionality */}
            {/* <Route path="/job-details/:id" element={
              <ProtectedRoute>
                <JobDetails />
              </ProtectedRoute>
            } />
            <Route path="/job/:id" element={
              <ProtectedRoute>
                <JobDetails />
              </ProtectedRoute>
            } />
            <Route path="/apply/:id" element={
              <ProtectedRoute>
                <JobApplication />
              </ProtectedRoute>
            } /> */}

            {/* TEMPORARILY DISABLED FOR RAILWAY DEPLOYMENT - Job-related dashboard features */}
            {/* Job Seeker Dashboard Routes - Professional Features */}
            {/* <Route path="/dashboard/overview" element={
              <ProtectedRoute>
                <JobSeekerOverviewDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/applications" element={
              <ProtectedRoute>
                <JobSeekerApplicationsDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/profile" element={
              <ProtectedRoute>
                <JobSeekerProfileDashboard />
              </ProtectedRoute>
            } /> */}

            {/* Company Dashboard Routes - Professional Features */}
            {/* <Route path="/dashboard/company/profile" element={
              <ProtectedRoute>
                <CompanyProfileDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/analytics" element={
              <ProtectedRoute>
                <CompanyAnalyticsDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/jobs" element={
              <ProtectedRoute>
                <CompanyJobsDashboard />
              </ProtectedRoute>
            } /> */}

            {/* Smart Dashboard - Role-based dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <SmartDashboard />
              </ProtectedRoute>
            } />
            
            {/* TEMPORARILY DISABLED FOR RAILWAY DEPLOYMENT - Legacy dashboard routes */}
            {/* Legacy dashboard routes - redirect to Smart Dashboard */}
            {/* <Route path="/employer-dashboard" element={<Navigate to="/dashboard?view=jobs" replace />} />
            <Route path="/applicant-dashboard" element={<Navigate to="/dashboard?view=applications" replace />} /> */}

            {/* AI Assistant Hub - Context-aware AI tools */}
            <Route path="/ai-assistant" element={
              <ProtectedRoute>
                <AIAssistantHub />
              </ProtectedRoute>
            } />
            
            {/* AI Assistant Tools - Individual tools accessible directly */}
            <Route path="/builder" element={<ResumeBuilder />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/analyzer" element={
              <ProtectedRoute requireEmailVerification={false}>
                <ResumeAnalyzer />
              </ProtectedRoute>
            } />
            <Route path="/resume-analyzer" element={
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
            <Route path="/upwork-proposal" element={
              <ProtectedRoute requireEmailVerification={false}>
                <UpworkProposal />
              </ProtectedRoute>
            } />
            <Route path="/update-resume" element={<ResumeUploader />} />
          </Routes>
        </Router>
      </SupabaseAuthProvider>
    </ErrorBoundary>
  );
}
