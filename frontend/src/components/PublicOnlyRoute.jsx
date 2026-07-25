import { Navigate } from "react-router-dom";
import { getToken } from "../services/api";

function PublicOnlyRoute({ children }) {
  if (getToken()) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default PublicOnlyRoute;
