import { Link, useLocation } from "react-router-dom";

function MovieCard({ movie, onFavorite, showFavorite = true }) {
  const location = useLocation();

  function handleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();

    if (onFavorite) {
      onFavorite(movie.id);
    }
  }

  return (
    <Link
      to={`/movies/${movie.id}`}
      state={{ from: location.pathname }}
      className="movie-card"
    >
      <img
        src={movie.poster || "https://via.placeholder.com/300x450?text=Sem+Poster"}
        alt={movie.tittle}
      />

      <div className="movie-info">
        <h3>{movie.tittle}</h3>
        <p>{movie.genre}</p>
        <span>{movie.realese_year}</span>

        {showFavorite && (
          <button className="favorite-button" onClick={handleFavorite}>
            Favoritar
          </button>
        )}
      </div>
    </Link>
  );
}

export default MovieCard;