import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/api";

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="header">
      <NavLink to="/home" className="logo" aria-label="CineLog — início">CINE<span>LOG</span></NavLink>

      <nav className="nav" aria-label="Navegação principal">
        <NavLink to="/home">Início</NavLink>
        <NavLink to="/favorites">Minha lista</NavLink>
        <NavLink to="/my-movies">Meus filmes</NavLink>
        <NavLink to="/reviews">Avaliações</NavLink>
        {user?.is_staff && <NavLink to="/admin">Admin</NavLink>}
      </nav>

      <button onClick={handleLogout} className="logout-button" aria-label="Sair da conta">
        <span className="logout-label">Sair</span><span aria-hidden="true">↗</span>
      </button>
    </header>
  );
}

export default Header;
