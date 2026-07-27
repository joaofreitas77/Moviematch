import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { applyTheme, getCurrentUser, logout } from "../services/api";
import UserAvatar from "./UserAvatar";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function loadUser() {
      getCurrentUser().then((currentUser) => {
        setUser(currentUser);
        applyTheme(currentUser.theme);
      }).catch(() => setUser(null));
    }
    function updateUser(event) {
      setUser(event.detail);
    }
    loadUser();
    window.addEventListener("cinelog:profile-updated", updateUser);
    return () => window.removeEventListener("cinelog:profile-updated", updateUser);
  }, []);

  useEffect(() => {
    function closeProfileMenu(event) {
      if (!profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeProfileMenu);
    return () => document.removeEventListener("pointerdown", closeProfileMenu);
  }, []);

  useEffect(() => {
    function closeWithEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setProfileMenuOpen(false);
      }
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
    setProfileMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className={`header ${location.pathname === "/home" ? "hero-header" : "light-surface-header"}`}>
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
        <NavLink to="/support" onClick={() => setMenuOpen(false)}><span>Suporte</span><small>Contato e sugestões</small></NavLink>
        <NavLink to="/profile" onClick={() => setMenuOpen(false)} className="mobile-profile-link"><span>Perfil</span><small>Conta e aparência</small></NavLink>
        {user?.is_staff && <NavLink to="/admin" onClick={() => setMenuOpen(false)}><span>Admin</span><small>Central de controle</small></NavLink>}
        <button type="button" onClick={handleLogout} className="mobile-menu-logout">Sair da conta <span aria-hidden="true">↗</span></button>
      </nav>

      <div className="header-account">
        <button onClick={handleLogout} className="logout-button" aria-label="Sair da conta">
          <span className="logout-label">Sair</span><span aria-hidden="true">↗</span>
        </button>
        <div className="profile-menu-wrapper" ref={profileMenuRef}>
          <button
            type="button"
            className="profile-menu-trigger"
            aria-label="Abrir menu do perfil"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            onClick={() => setProfileMenuOpen((open) => !open)}
          >
            <UserAvatar user={user} />
          </button>
          {profileMenuOpen && (
            <div className="profile-dropdown" role="menu">
              <div className="profile-dropdown-user">
                <UserAvatar user={user} className="large" />
                <div><strong>{user?.username}</strong><small>{user?.email || "E-mail não informado"}</small></div>
              </div>
              <Link to="/profile" role="menuitem" onClick={() => setProfileMenuOpen(false)}>
                <span>Configurações do perfil</span><small>Conta, segurança e tema</small>
              </Link>
              <button type="button" role="menuitem" onClick={handleLogout}>Sair da conta <span aria-hidden="true">↗</span></button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
