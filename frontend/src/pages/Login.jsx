import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login, loginAdmin } from "../services/api";

function Login({ admin = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const authenticate = admin ? loginAdmin : login;
      await authenticate(username, password);
      navigate(admin ? "/admin" : "/home", { replace: true });
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <main className={`auth-page${admin ? " admin-auth-page" : ""}`}>
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>{admin ? "Acesso administrativo" : "Entrar"}</h1>

        {admin && <p className="auth-intro">Área exclusiva para administradores do CineLog.</p>}

        {erro && <p className="auth-error">{erro}</p>}
        {!admin && searchParams.get("verified") === "1" && <p className="verification-feedback success">E-mail confirmado. Agora você já pode entrar.</p>}

        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">{admin ? "Entrar como admin" : "Entrar"}</button>

        {admin ? (
          <p>Não é administrador? <Link to="/login">Voltar ao acesso comum</Link></p>
        ) : (
          <p>Não tem conta? <Link to="/register">Cadastrar</Link></p>
        )}
      </form>
      {!admin && <Link className="admin-access-link" to="/admin/login">Admin</Link>}
    </main>
  );
}

export default Login;
