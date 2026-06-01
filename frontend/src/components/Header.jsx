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
        CineLog
      </Link>

      <nav className="nav">
        <Link to="/" replace>Inicio</Link>
        <Link to="/favorites" replace>Favoritos</Link>
        <Link to="/reviews" replace>Avaliações Recentes</Link>

        <button onClick={handleLogout} className="logout-button">
          Sair
        </button>
      </nav>
    </header>
  );
}

export default Header;