import { useEffect, useState } from "react";
import { getFavorites, getMovieById, removeFavorite } from "../services/api";
import MovieCard from "../components/MovieCard";
import "../styles/global.css";

function Favorites() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    try {
      const favorites = await getFavorites();

      const moviesData = await Promise.all(
        favorites.map(async (favorite) => {
          const movie = await getMovieById(favorite.movie);

          return {
            ...movie,
            favoriteId: favorite.id,
          };
        })
      );

      setMovies(moviesData);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleRemoveFavorite(favoriteId) {
    await removeFavorite(favoriteId);
    loadFavorites();
  }

  return (
    <main className="page">
      <section className="catalog">
        <h2>Meus Favoritos</h2>

        <div className="movie-row">
          {movies.map((movie) => (
            <div className="favorite-card-wrapper" key={movie.favoriteId}>
              <MovieCard movie={movie} showFavorite={false} />

              <button
                className="remove-favorite-button"
                onClick={() => handleRemoveFavorite(movie.favoriteId)}
              >
                Remover dos Favoritos
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Favorites;