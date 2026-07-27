import { useEffect, useMemo, useState } from "react";
import { getAdminStats, getAdminUsers, updateUserStatus } from "../services/api";

const formatDate = (value) => value ? new Date(value).toLocaleString("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
}) : "Nunca";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([getAdminStats(), getAdminUsers()])
      .then(([statsData, usersData]) => { setStats(statsData); setUsers(usersData); })
      .catch(() => setMessage("Não foi possível carregar o painel administrativo."));
  }, []);

  const filteredUsers = useMemo(() => users.filter((user) =>
    `${user.username} ${user.email}`.toLowerCase().includes(search.toLowerCase())
  ), [users, search]);

  async function toggleUser(user) {
    try {
      await updateUserStatus(user.id, !user.is_active);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, is_active: !item.is_active } : item));
      setStats((current) => ({
        ...current,
        active_users: current.active_users + (user.is_active ? -1 : 1),
        inactive_users: current.inactive_users + (user.is_active ? 1 : -1),
      }));
      setMessage(user.is_active ? "Usuário desativado." : "Usuário reativado.");
    } catch (error) {
      setMessage(error.message);
    }
    window.setTimeout(() => setMessage(""), 3000);
  }

  return (
    <main className="page admin-page">
      {message && <div className="toast" role="status">{message}</div>}
      <section className="admin-heading">
        <div><span className="section-eyebrow">CENTRAL DE CONTROLE</span><h1>Painel administrativo</h1><p>Acompanhe a comunidade e gerencie o acesso dos usuários.</p></div>
        <span className="admin-badge">Acesso protegido</span>
      </section>

      {stats && <section className="stats-grid">
        <article><span>Usuários</span><strong>{stats.users}</strong><small>{stats.active_users} ativos · {stats.inactive_users} inativos</small></article>
        <article><span>Filmes</span><strong>{stats.movies}</strong><small>{stats.user_movies} adicionados por usuários</small></article>
        <article><span>Avaliações</span><strong>{stats.reviews}</strong><small>atividade da comunidade</small></article>
        <article><span>Favoritos</span><strong>{stats.favorites}</strong><small>itens salvos</small></article>
      </section>}

      <section className="users-panel">
        <div className="users-toolbar"><div><h2>Usuários cadastrados</h2><p>Senhas nunca são exibidas ou acessíveis.</p></div><input type="search" placeholder="Buscar usuário ou e-mail" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <div className="table-scroll"><table className="users-table">
          <thead><tr><th>Usuário</th><th>Status</th><th>Cadastro</th><th>Último acesso</th><th>Atividade</th><th>Ação</th></tr></thead>
          <tbody>{filteredUsers.map((user) => <tr key={user.id}>
            <td><div className="user-cell"><span className="user-avatar">{user.avatar ? <img src={user.avatar} alt="" /> : user.username.charAt(0).toUpperCase()}</span><div><strong>{user.username}</strong><small>{user.email || "Sem e-mail"}{user.is_staff ? " · Administrador" : ""}</small></div></div></td>
            <td><span className={`status-pill ${user.is_active ? "active" : "inactive"}`}>{user.is_active ? "Ativo" : "Inativo"}</span></td>
            <td>{formatDate(user.date_joined)}</td><td>{formatDate(user.last_login)}</td>
            <td><span className="activity-data">{user.movies_count} filmes · {user.reviews_count} avaliações · {user.favorites_count} favoritos</span></td>
            <td><button className={user.is_active ? "deactivate-button" : "activate-button"} disabled={user.is_staff} onClick={() => toggleUser(user)}>{user.is_staff ? "Protegido" : user.is_active ? "Desativar" : "Ativar"}</button></td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </main>
  );
}

export default AdminDashboard;
