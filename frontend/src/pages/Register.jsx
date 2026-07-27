import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/api";
import { isPasswordComplex, passwordRequirements } from "../utils/password";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    if (!isPasswordComplex(password)) {
      setErro("Crie uma senha que atenda a todos os requisitos abaixo.");
      return;
    }

    try {
      await register(username, email, password);
      navigate("/login", { replace: true });
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Cadastrar</h1>

        {erro && <p className="auth-error">{erro}</p>}

        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          autoComplete="username"
        />

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Crie uma senha segura"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <ul className="password-requirements" aria-label="Requisitos da senha">
          {passwordRequirements.map(({ label, test }) => (
            <li key={label} className={test(password) ? "valid" : ""}>{label}</li>
          ))}
        </ul>

        <button type="submit">Cadastrar</button>

        <p>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
      <Link className="admin-access-link" to="/admin/login">Admin</Link>
    </main>
  );
}

export default Register;
