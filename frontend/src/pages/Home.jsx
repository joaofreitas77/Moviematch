import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { addFavorite, getMovies, getRecommendations } from "../services/api";
import MovieCard from "../components/MovieCard";

const normalizeRating = (movie) => Number.parseFloat(movie.imdb_rating) || 0;

function MovieRow({ title, eyebrow, movies, onFavorite, ranked = false, expanded = false, action }) {
  if (!movies.length) return null;

  return (
    <section className="catalog-section">
      <div className="section-heading">
        <div>
          {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        <div className="section-actions">
          <span className="section-count">{movies.length} títulos</span>
          {action}
        </div>
      </div>
      <div className={`movie-row ${ranked ? "ranked-row" : ""} ${expanded ? "expanded-row" : ""}`}>
        {movies.map((movie, index) => (
          <MovieCard key={movie.id} movie={movie} onFavorite={onFavorite} rank={ranked ? index + 1 : undefined} />
        ))}
      </div>
    </section>
  );
}

function Home() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showAllMovies, setShowAllMovies] = useState(false);
  const [recommendations, setRecommendations] = useState({ results: [], favorite_genres: [], has_preferences: false });

  useEffect(() => {
    getMovies()
      .then(setMovies)
      .catch(() => setMessage("Não foi possível carregar o catálogo."))
      .finally(() => setLoading(false));
    getRecommendations().then(setRecommendations).catch(() => null);
  }, []);

  const sortedMovies = useMemo(
    () => [...movies].sort((a, b) => normalizeRating(b) - normalizeRating(a)),
    [movies]
  );

  const genres = useMemo(() => {
    const all = movies.flatMap((movie) => (movie.genre || "").split(",").map((genre) => genre.trim())).filter(Boolean);
    return ["Todos", ...new Set(all)].slice(0, 8);
  }, [movies]);

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.tittle.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = activeGenre === "Todos" || movie.genre?.split(",").map((g) => g.trim()).includes(activeGenre);
    return matchesSearch && matchesGenre;
  });

  const featured = sortedMovies[0] || movies[0];
  const recentlyAdded = [...movies].sort((a, b) => {
    const dateDifference = new Date(b.created_at || 0) - new Date(a.created_at || 0);
    return dateDifference || Number(b.id) - Number(a.id);
  });
  const genreRows = genres.slice(1, 4).map((genre) => ({
    genre,
    movies: movies.filter((movie) => movie.genre?.split(",").map((item) => item.trim()).includes(genre)).slice(0, 12),
  }));

  async function handleFavorite(movieId) {
    try {
      await addFavorite(movieId);
      setMessage("Adicionado à sua lista.");
    } catch {
      setMessage("Este filme já está na sua lista ou não pôde ser adicionado.");
    }
    window.setTimeout(() => setMessage(""), 3000);
  }

  if (loading) return <main className="page loading-state"><div className="loader" /><p>Preparando sua sessão...</p></main>;

  return (
    <main className="page home-page">
      {message && <div className="toast" role="status">{message}</div>}

      {featured ? (
        <section className="hero-banner" style={{ "--hero-image": `url("${featured.poster}")` }}>
          <div className="hero-content">
            <span className="hero-kicker">DESTAQUE DO CATÁLOGO</span>
            <h1>{featured.tittle}</h1>
            <div className="hero-meta">
              {featured.imdb_rating && <span className="hero-rating">★ {featured.imdb_rating} IMDb</span>}
              <span>{featured.realese_year}</span>
              <span>{featured.runtime || featured.type}</span>
              {featured.rated && <span className="age-rating">{featured.rated}</span>}
            </div>
            <p>{featured.description || "Descubra histórias marcantes e encontre seu próximo filme favorito."}</p>
            <div className="hero-actions">
              <Link to={`/movies/${featured.id}`} className="primary-button">▶ Ver detalhes</Link>
              <button onClick={() => handleFavorite(featured.id)} className="secondary-button">＋ Minha lista</button>
            </div>
          </div>
        </section>
      ) : (
        <section className="empty-hero"><h1>Seu cinema começa aqui.</h1><p>Importe filmes pela API para montar o catálogo.</p></section>
      )}

      <div className="catalog">
        <section className="discovery-bar" aria-label="Buscar e filtrar filmes">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder="Busque por um filme..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <div className="genre-chips">
            {genres.map((genre) => (
              <button key={genre} className={activeGenre === genre ? "active" : ""} onClick={() => setActiveGenre(genre)}>{genre}</button>
            ))}
          </div>
        </section>

        {(search || activeGenre !== "Todos") ? (
          <MovieRow title="Resultados" eyebrow={`${filteredMovies.length} encontrados`} movies={filteredMovies} onFavorite={handleFavorite} />
        ) : (
          <>
            <MovieRow
              title="Escolhidos para você"
              eyebrow={recommendations.has_preferences && recommendations.favorite_genres.length
                ? `Baseado em ${recommendations.favorite_genres.join(" · ")}`
                : "Descubra seu próximo favorito"}
              movies={recommendations.results.slice(0, 10)}
              onFavorite={handleFavorite}
            />
            <MovieRow title="Mais bem avaliados" eyebrow="O melhor do CineLog" movies={sortedMovies.slice(0, 10)} onFavorite={handleFavorite} ranked />
            <MovieRow
              title="Todos os filmes"
              eyebrow="Adicionados recentemente"
              movies={showAllMovies ? recentlyAdded : recentlyAdded.slice(0, 10)}
              onFavorite={handleFavorite}
              expanded={showAllMovies}
              action={recentlyAdded.length > 10 && (
                <button className="show-all-button" onClick={() => setShowAllMovies((current) => !current)}>
                  {showAllMovies ? "Mostrar menos ↑" : `Ver todos (${recentlyAdded.length}) →`}
                </button>
              )}
            />
            {genreRows.map(({ genre, movies: genreMovies }) => (
              <MovieRow key={genre} title={genre} eyebrow="Explore por categoria" movies={genreMovies} onFavorite={handleFavorite} />
            ))}
          </>
        )}
      </div>

      <footer className="footer"><span className="logo footer-logo">CINE<span>LOG</span></span><p>Descubra. Avalie. Guarde seus favoritos.</p></footer>
    </main>
  );
}

export default Home;
