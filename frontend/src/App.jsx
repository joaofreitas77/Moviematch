import { Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Favorites from "./pages/Favorites";
import RecentReviews from "./pages/RecentReviews";

import { getToken } from "./services/api";

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
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
        path="/reviews"
        element={
          <ProtectedLayout>
            <RecentReviews />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}

export default App;