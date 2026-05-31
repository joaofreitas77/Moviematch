import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Favorites from "./pages/Favorites";

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
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
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
    </Routes>
  );
}

export default App;