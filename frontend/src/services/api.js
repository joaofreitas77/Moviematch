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