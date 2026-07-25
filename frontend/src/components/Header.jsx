import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/api";

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    function closeWithEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("keydown", closeWithEscape);
    document.body.classList.toggle("menu-open", menuOpen);

    return () => {
      document.removeEventListener("keydown", closeWithEscape);
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="header">
      <NavLink to="/home" className="logo" aria-label="CineLog — início">CINE<span>LOG</span></NavLink>

      <button
        type="button"
        className={`menu-toggle ${menuOpen ? "open" : ""}`}
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span /><span /><span />
      </button>

      {menuOpen && <button type="button" className="menu-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}

      <nav id="main-navigation" className={`nav ${menuOpen ? "open" : ""}`} aria-label="Navegação principal">
        <div className="mobile-menu-heading">
          <span>Navegação</span>
          {user && <small>{user.username}</small>}
        </div>
        <NavLink to="/home" onClick={() => setMenuOpen(false)}><span>Início</span><small>Descobrir filmes</small></NavLink>
        <NavLink to="/favorites" onClick={() => setMenuOpen(false)}><span>Minha lista</span><small>Seus favoritos</small></NavLink>
        <NavLink to="/my-movies" onClick={() => setMenuOpen(false)}><span>Meus filmes</span><small>Catálogo pessoal</small></NavLink>
        <NavLink to="/reviews" onClick={() => setMenuOpen(false)}><span>Avaliações</span><small>Atividade recente</small></NavLink>
        {user?.is_staff && <NavLink to="/admin" onClick={() => setMenuOpen(false)}><span>Admin</span><small>Central de controle</small></NavLink>}
        <button type="button" onClick={handleLogout} className="mobile-menu-logout">Sair da conta <span aria-hidden="true">↗</span></button>
      </nav>

      <button onClick={handleLogout} className="logout-button" aria-label="Sair da conta">
        <span className="logout-label">Sair</span><span aria-hidden="true">↗</span>
      </button>
    </header>
  );
}

export default Header;
