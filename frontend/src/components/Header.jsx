import { Link, useNavigate } from "react-router-dom";
import { logout } from "../services/api";

function Header() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="header">
      <Link to="/" className="logo">
        MovieMatch
      </Link>

      <nav>
        <button onClick={handleLogout} className="logout-button">
          Sair
        </button>
      </nav>
    </header>
  );
}

export default Header;