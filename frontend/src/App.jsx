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

  return (
    <Routes key={sessionVersion}>
      <Route path="/" element={<RootRedirect />} />

      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

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
    </Routes>
  );
}

export default App;
