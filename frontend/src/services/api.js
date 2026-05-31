const API_URL = "http://127.0.0.1:8000/api/v1";

export async function login(username, password) {
  const response = await fetch(`${API_URL}/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error("Usuário ou senha inválidos");
  }

  const data = await response.json();

  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);

  return data;
}

export async function register(username, email, password) {
  const response = await fetch(`${API_URL}/accounts/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    throw new Error("Erro ao cadastrar usuário");
  }

  return await response.json();
}

export function getToken() {
  return localStorage.getItem("access");
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export async function getMovies() {
  const response = await fetch(`${API_URL}/movies/`);

  const data = await response.json();

  return data.results || data;
}

export async function getMovieById(id) {
  const response = await fetch(`${API_URL}/movies/${id}/`);

  return await response.json();
}