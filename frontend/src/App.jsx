import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Error boundary
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout.jsx";

// Route Guards
import PrivateRoute from "./routes/PrivateRoute.jsx";
import RoleRoute    from "./routes/RoleRoute.jsx";

// Loading fallback
import { PageLoader } from "./components/common/LoadingSkeleton.jsx";

// Pages — lazy loaded
const Landing             = lazy(() => import("./pages/Landing.jsx"));
const Login               = lazy(() => import("./pages/Login.jsx"));
const Register            = lazy(() => import("./pages/Register.jsx"));
const Dashboard           = lazy(() => import("./pages/Dashboard.jsx"));
const Projects            = lazy(() => import("./pages/Projects.jsx"));
const ProjectWorkspace    = lazy(() => import("./pages/ProjectWorkspace.jsx"));
const FreelancerDiscovery = lazy(() => import("./pages/FreelancerDiscovery.jsx"));
const Analytics           = lazy(() => import("./pages/Analytics.jsx"));
const Payments            = lazy(() => import("./pages/Payments.jsx"));
const Profile             = lazy(() => import("./pages/Profile.jsx"));
const Settings            = lazy(() => import("./pages/Settings.jsx"));
const Notifications       = lazy(() => import("./pages/Notifications.jsx"));
const AdminPanel          = lazy(() => import("./pages/AdminPanel.jsx"));
const NotFound            = lazy(() => import("./pages/NotFound.jsx"));
const VerifyEmail         = lazy(() => import("./pages/VerifyEmail.jsx"));
const ResetPassword       = lazy(() => import("./pages/ResetPassword.jsx"));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public */}
            <Route path="/"         element={<Landing />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register"              element={<Register />} />
            <Route path="/verify-email/:token"   element={<VerifyEmail />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected — Dashboard shell */}
            <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
              <Route path="/dashboard"           element={<Dashboard />} />
              <Route path="/projects"            element={<Projects />} />
              <Route path="/projects/:id"        element={<ProjectWorkspace />} />
              <Route path="/freelancers"         element={<FreelancerDiscovery />} />
              <Route path="/analytics"           element={<Analytics />} />
              <Route path="/payments"            element={<Payments />} />
              <Route path="/profile/:id?"        element={<Profile />} />
              <Route path="/settings"            element={<Settings />} />
              <Route path="/notifications"       element={<Notifications />} />

              {/* Admin only */}
              <Route element={<RoleRoute roles={["admin"]} />}>
                <Route path="/admin" element={<AdminPanel />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </ErrorBoundary>
  );
}
