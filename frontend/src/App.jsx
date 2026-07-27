import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";

import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Favorites from "./pages/Favorites";
import RecentReviews from "./pages/RecentReviews";
import MyMovies from "./pages/MyMovies";
import AdminDashboard from "./pages/AdminDashboard";
import Support from "./pages/Support";
import Profile from "./pages/Profile";
import About from "./pages/About";
import VerifyEmail from "./pages/VerifyEmail";

import { getSessionVersion, getToken } from "./services/api";

function RootRedirect() {
  const token = getToken();

  return token
    ? <Navigate to="/home" replace />
    : <Navigate to="/login" replace />;
}

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Header />
      {children}
    </ProtectedRoute>
  );
}

function App() {
  const [sessionVersion, setSessionVersion] = useState(getSessionVersion);
  const [showLoginTransition, setShowLoginTransition] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function synchronizeSession() {
      setSessionVersion(getSessionVersion());
    }

    window.addEventListener("pageshow", synchronizeSession);
    window.addEventListener("popstate", synchronizeSession);
    window.addEventListener("cinelog:session-change", synchronizeSession);

    return () => {
      window.removeEventListener("pageshow", synchronizeSession);
      window.removeEventListener("popstate", synchronizeSession);
      window.removeEventListener("cinelog:session-change", synchronizeSession);
    };
  }, []);

  useEffect(() => {
    let showTimer;

    function synchronizeLoading(event) {
      if (event.detail.pending > 0) {
        window.clearTimeout(showTimer);
        showTimer = window.setTimeout(() => setIsLoading(true), 120);
      } else {
        window.clearTimeout(showTimer);
        setIsLoading(false);
      }
    }

    window.addEventListener("cinelog:loading", synchronizeLoading);
    return () => {
      window.removeEventListener("cinelog:loading", synchronizeLoading);
      window.clearTimeout(showTimer);
    };
  }, []);

  useEffect(() => {
    let transitionTimer;

    function playLoginTransition() {
      setShowLoginTransition(true);
      window.clearTimeout(transitionTimer);
      const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 450 : 1800;
      transitionTimer = window.setTimeout(() => setShowLoginTransition(false), duration);
    }

    window.addEventListener("cinelog:login-success", playLoginTransition);
    return () => {
      window.removeEventListener("cinelog:login-success", playLoginTransition);
      window.clearTimeout(transitionTimer);
    };
  }, []);

  return (
    <>
      {showLoginTransition && (
        <div className="login-transition" role="status" aria-label="Login realizado. Carregando CineLog.">
          <img src="/animation.svg" alt="CineLog" />
        </div>
      )}
      {isLoading && !showLoginTransition && (
        <div className="global-loading-overlay" role="status" aria-live="polite">
          <span className="global-loading-spinner" aria-hidden="true" />
          <strong>Carregando...</strong>
        </div>
      )}
      <Routes key={sessionVersion}>
      <Route path="/" element={<RootRedirect />} />

      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/verify-email" element={<PublicOnlyRoute><VerifyEmail /></PublicOnlyRoute>} />
      <Route path="/admin/login" element={<PublicOnlyRoute><Login admin /></PublicOnlyRoute>} />

      <Route
        path="/home"
        element={
          <ProtectedLayout>
            <Home />
          </ProtectedLayout>
        }
      />

      <Route
        path="/movies/:id"
        element={
          <ProtectedLayout>
            <MovieDetails />
          </ProtectedLayout>
        }
      />

      <Route
        path="/favorites"
        element={
          <ProtectedLayout>
            <Favorites />
          </ProtectedLayout>
        }
      />

      <Route
        path="/my-movies"
        element={<ProtectedLayout><MyMovies /></ProtectedLayout>}
      />

      <Route
        path="/reviews"
        element={
          <ProtectedLayout>
            <RecentReviews />
          </ProtectedLayout>
        }
      />

      <Route
        path="/admin"
        element={<ProtectedLayout><AdminRoute><AdminDashboard /></AdminRoute></ProtectedLayout>}
      />
      <Route
        path="/support"
        element={<ProtectedLayout><Support /></ProtectedLayout>}
      />
      <Route
        path="/about"
        element={<ProtectedLayout><About /></ProtectedLayout>}
      />
      <Route
        path="/profile"
        element={<ProtectedLayout><Profile /></ProtectedLayout>}
      />
      </Routes>
    </>
  );
}

export default App;
