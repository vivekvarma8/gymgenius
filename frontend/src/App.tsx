import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useAuthContext } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { PageFallbackSkeleton } from "./components/SkeletonLoader";

const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const MembersPage = lazy(() => import("./pages/MembersPage").then((m) => ({ default: m.MembersPage })));

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuthContext();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Suspense fallback={<PageFallbackSkeleton />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <MembersPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;