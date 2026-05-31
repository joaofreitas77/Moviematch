import { Link } from "react-router-dom";

function MovieCard({ movie }) {
  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      <img
        src={movie.poster || "https://via.placeholder.com/300x450?text=Sem+Poster"}
        alt={movie.tittle}
      />

      <div className="movie-info">
        <h3>{movie.tittle}</h3>
        <p>{movie.genre}</p>
        <span>{movie.realese_year}</span>
      </div>
    </Link>
  );
}

export default MovieCard;