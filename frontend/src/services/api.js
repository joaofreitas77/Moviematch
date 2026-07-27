const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");

let pendingRequests = 0;

function updateLoadingState(change) {
  pendingRequests = Math.max(0, pendingRequests + change);
  window.dispatchEvent(new CustomEvent("cinelog:loading", {
    detail: { pending: pendingRequests },
  }));
}

async function trackedFetch(url, options) {
  updateLoadingState(1);
  try {
    return await fetch(url, options);
  } finally {
    updateLoadingState(-1);
  }
}

function getValidationMessage(data) {
  return Object.values(data || {}).flat().find(Boolean);
}

function markSessionChange() {
  const version = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  localStorage.setItem("session_version", version);
  window.dispatchEvent(new Event("cinelog:session-change"));
}

export function getSessionVersion() {
  return localStorage.getItem("session_version") || "anonymous";
}

async function authenticate(endpoint, username, password) {
  const response = await trackedFetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Usuário ou senha inválidos");
  }

  const data = await response.json();

  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  markSessionChange();
  window.dispatchEvent(new Event("cinelog:login-success"));

  return data;
}

export async function register(username, email, password) {
  const response = await trackedFetch(`${API_URL}/accounts/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(getValidationMessage(error) || "Erro ao cadastrar usuário.");
  }

  return await response.json();
}

export async function verifyEmail(email, code) {
  const response = await trackedFetch(`${API_URL}/accounts/verify-email/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || getValidationMessage(data) || "Não foi possível confirmar o e-mail.");
  return data;
}

export async function resendVerification(email) {
  const response = await trackedFetch(`${API_URL}/accounts/resend-verification/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || getValidationMessage(data) || "Não foi possível reenviar o código.");
  return data;
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

  const response = await trackedFetch(`${API_URL}/token/refresh/`, {
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
  let response = await trackedFetch(url, { ...options, headers });

  if (response.status === 401) {
    const token = await refreshAccessToken();
    response = await trackedFetch(url, {
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

export function applyTheme(theme) {
  const selectedTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = selectedTheme;
  localStorage.setItem("cinelog_theme", selectedTheme);
}

export function getStoredTheme() {
  return localStorage.getItem("cinelog_theme") || "dark";
}

export async function updateProfile(changes) {
  const response = await authenticatedFetch(`${API_URL}/accounts/profile/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(getValidationMessage(data) || data.detail || "Não foi possível atualizar o perfil.");
  }
  if (data.theme) applyTheme(data.theme);
  window.dispatchEvent(new CustomEvent("cinelog:profile-updated", { detail: data }));
  return data;
}

export async function getMovies() {
  const movies = [];
  let nextPage = `${API_URL}/movies/`;

  while (nextPage) {
    const response = await trackedFetch(nextPage);

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
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Não foi possível carregar o filme.");
  return data;
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

export function login(username, password) {
  return authenticate("/token/", username, password);
}

export function loginAdmin(username, password) {
  return authenticate("/token/admin/", username, password);
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

  const response = await trackedFetch(`${API_URL}/favorites/`, {
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

  const response = await trackedFetch(`${API_URL}/favorites/`, {
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

  if (!response.ok) {
    throw new Error(getValidationMessage(data) || "Não foi possível adicionar aos favoritos.");
  }

  return data;
}

export async function removeFavorite(favoriteId) {
  const token = getToken();

  const response = await trackedFetch(`${API_URL}/favorites/${favoriteId}/`, {
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

  let response = await trackedFetch(`${API_URL}/reviews/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    token = await refreshAccessToken();

    response = await trackedFetch(`${API_URL}/reviews/`, {
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

export async function getMovieReviews(movieId) {
  const reviews = [];
  let nextPage = `${API_URL}/reviews/?movie=${encodeURIComponent(movieId)}`;

  while (nextPage) {
    const response = await authenticatedFetch(nextPage);
    if (!response.ok) throw new Error("Não foi possível carregar as avaliações deste filme.");
    const data = await response.json();
    if (Array.isArray(data)) return data;
    reviews.push(...(data.results || []));
    nextPage = data.next;
  }

  return reviews;
}

export async function addReview(movieId, rating, comment) {
  let token = getToken();

  let response = await trackedFetch(`${API_URL}/reviews/`, {
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

    response = await trackedFetch(`${API_URL}/reviews/`, {
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

export async function updateReview(reviewId, rating, comment) {
  const response = await authenticatedFetch(`${API_URL}/reviews/${reviewId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating, comment }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Não foi possível editar a avaliação");
  return data;
}

export async function removeReview(reviewId) {
  const response = await authenticatedFetch(`${API_URL}/reviews/${reviewId}/`, { method: "DELETE" });
  if (!response.ok) throw new Error("Não foi possível remover a avaliação");
}

export async function getRecommendations() {
  const response = await authenticatedFetch(`${API_URL}/recomendations/`);
  if (!response.ok) throw new Error("Não foi possível carregar recomendações");
  return response.json();
}

export async function sendSupportRequest(request) {
  const response = await authenticatedFetch(`${API_URL}/accounts/support/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = await response.json();

  if (!response.ok) {
    const validationMessage = Object.values(data).flat().find(Boolean);
    throw new Error(data.error || validationMessage || "Não foi possível enviar sua mensagem.");
  }

  return data;
}
