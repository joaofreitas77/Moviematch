import { Link, useLocation } from "react-router-dom";

const FALLBACK_POSTER = "https://placehold.co/400x600/202024/e5e5e5?text=Sem+poster";

function MovieCard({ movie, onFavorite, showFavorite = true, rank }) {
  const location = useLocation();

  function handleFavorite(event) {
    event.preventDefault();
    event.stopPropagation();
    onFavorite?.(movie.id);
  }

  const rating = Number.parseFloat(movie.imdb_rating);
  const firstGenre = movie.genre?.split(",")[0]?.trim();

  return (
    <article className="movie-card-shell">
      {rank && <span className="movie-rank" aria-label={`Posição ${rank}`}>{rank}</span>}
      <Link
        to={`/movies/${movie.id}`}
        state={{ from: location.pathname }}
        className="movie-card"
      >
        <div className="poster-wrap">
          <img src={movie.poster || FALLBACK_POSTER} alt={`Pôster de ${movie.tittle}`} loading="lazy" />
          <div className="poster-overlay">
            <span className="view-details">Ver detalhes</span>
          </div>
          {Number.isFinite(rating) && <span className="rating-badge">★ {rating.toFixed(1)}</span>}
        </div>

        <div className="movie-info">
          <h3>{movie.tittle}</h3>
          <div className="movie-meta">
            <span>{movie.realese_year}</span>
            {firstGenre && <span>{firstGenre}</span>}
          </div>
        </div>
      </Link>

      {showFavorite && (
        <button className="favorite-button" onClick={handleFavorite} aria-label={`Adicionar ${movie.tittle} à lista`}>
          <span aria-hidden="true">＋</span> Minha lista
        </button>
      )}
    </article>
  );
}

export default MovieCard;
