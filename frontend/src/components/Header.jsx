import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../services/api";

function Header() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="header">
      <NavLink to="/home" className="logo" aria-label="CineLog — início">
        CINE<span>LOG</span>
      </NavLink>

      <nav className="nav" aria-label="Navegação principal">
        <NavLink to="/home">Início</NavLink>
        <NavLink to="/favorites">Minha lista</NavLink>
        <NavLink to="/reviews">Avaliações</NavLink>
      </nav>

      <button onClick={handleLogout} className="logout-button" aria-label="Sair da conta">
        <span className="logout-label">Sair</span>
        <span aria-hidden="true">↗</span>
      </button>
    </header>
  );
}

export default Header;
