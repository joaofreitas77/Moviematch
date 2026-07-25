import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/api";

function AdminRoute({ children }) {
  const [state, setState] = useState({ loading: true, isAdmin: false });

  useEffect(() => {
    getCurrentUser()
      .then((user) => setState({ loading: false, isAdmin: user.is_staff }))
      .catch(() => setState({ loading: false, isAdmin: false }));
  }, []);

  if (state.loading) return <main className="page loading-state"><div className="loader" /><p>Validando acesso...</p></main>;
  if (!state.isAdmin) return <Navigate to="/home" replace />;
  return children;
}

export default AdminRoute;
