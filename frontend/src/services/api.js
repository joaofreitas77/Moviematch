const API_URL = "http://127.0.0.1:8000/api/v1";

function markSessionChange() {
  const version = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  localStorage.setItem("session_version", version);
  window.dispatchEvent(new Event("cinelog:session-change"));
}

export function getSessionVersion() {
  return localStorage.getItem("session_version") || "anonymous";
}

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
  markSessionChange();

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
  markSessionChange();
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh");

  if (!refresh) {
    logout();
    throw new Error("Sessão expirada");
  }

  const response = await fetch(`${API_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    logout();
    throw new Error("Sessão expirada");
  }

  const data = await response.json();
  localStorage.setItem("access", data.access);
  return data.access;
}

async function authenticatedFetch(url, options = {}) {
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${getToken()}`,
  };
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const token = await refreshAccessToken();
    response = await fetch(url, {
      ...options,
      headers: { ...headers, Authorization: `Bearer ${token}` },
    });
  }

  return response;
}

export async function getCurrentUser() {
  const response = await authenticatedFetch(`${API_URL}/accounts/me/`);
  if (!response.ok) throw new Error("Não foi possível carregar o perfil");
  return response.json();
}

export async function getMovies() {
  const movies = [];
  let nextPage = `${API_URL}/movies/`;

  while (nextPage) {
    const response = await fetch(nextPage);

    if (!response.ok) {
      throw new Error("Erro ao buscar filmes");
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data;
    }

    movies.push(...(data.results || []));
    nextPage = data.next;
  }

  return movies;
}

export async function getMovieById(id) {
  const response = await authenticatedFetch(`${API_URL}/movies/${id}/`);

  return await response.json();
}

export async function getMyMovies() {
  const movies = [];
  let nextPage = `${API_URL}/movies/?mine=true`;

  while (nextPage) {
    const response = await authenticatedFetch(nextPage);
    if (!response.ok) throw new Error("Erro ao buscar seus filmes");
    const data = await response.json();
    if (Array.isArray(data)) return data;
    movies.push(...(data.results || []));
    nextPage = data.next;
  }

  return movies;
}

export async function importMovie(title) {
  const response = await authenticatedFetch(`${API_URL}/movies/import/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Não foi possível adicionar o filme");
  return data;
}

export async function removeMovie(movieId) {
  const response = await authenticatedFetch(`${API_URL}/movies/${movieId}/`, { method: "DELETE" });
  if (!response.ok) throw new Error("Não foi possível remover o filme");
}

export async function getAdminStats() {
  const response = await authenticatedFetch(`${API_URL}/accounts/admin/stats/`);
  if (!response.ok) throw new Error("Acesso administrativo necessário");
  return response.json();
}

export async function getAdminUsers() {
  const response = await authenticatedFetch(`${API_URL}/accounts/admin/users/`);
  if (!response.ok) throw new Error("Acesso administrativo necessário");
  return response.json();
}

export async function updateUserStatus(userId, isActive) {
  const response = await authenticatedFetch(`${API_URL}/accounts/admin/users/${userId}/status/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Não foi possível alterar o usuário");
  return data;
}

export async function getFavorites() {
  const token = getToken();

  const response = await fetch(`${API_URL}/favorites/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar favoritos");
  }

  const data = await response.json();

  return data.results || data;
}

export async function addFavorite(movieId) {
  const token = getToken();

  const response = await fetch(`${API_URL}/favorites/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      movie: movieId,
    }),
  });

  const data = await response.json();

  console.log("STATUS FAVORITE:", response.status);
  console.log("RESPOSTA FAVORITE:", data);

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

export async function removeFavorite(favoriteId) {
  const token = getToken();

  const response = await fetch(`${API_URL}/favorites/${favoriteId}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao remover favorito");
  }
}

export async function getReviews() {
  let token = getToken();

  let response = await fetch(`${API_URL}/reviews/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    token = await refreshAccessToken();

    response = await fetch(`${API_URL}/reviews/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  if (!response.ok) {
    throw new Error("Erro ao buscar avaliações");
  }

  const data = await response.json();

  return data.results || data;
}

export async function addReview(movieId, rating, comment) {
  let token = getToken();

  let response = await fetch(`${API_URL}/reviews/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      movie: movieId,
      rating,
      comment,
    }),
  });

  if (response.status === 401) {
    token = await refreshAccessToken();

    response = await fetch(`${API_URL}/reviews/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        movie: movieId,
        rating,
        comment,
      }),
    });
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}
