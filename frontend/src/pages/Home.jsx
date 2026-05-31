import { useEffect, useState } from "react";
import { getMovies, addFavorite } from "../services/api";
import MovieCard from "../components/MovieCard";
import "../styles/global.css";

function Home() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    getMovies().then(setMovies);
  }, []);

  async function handleFavorite(movieId) {
    try {
      await addFavorite(movieId);
      alert("Filme adicionado aos favoritos!");
    } catch (error) {
      alert("Erro ao favoritar filme");
      console.error(error);
    }
  }

  return (
    <main className="page">
      <section className="banner">
        <h1>CineLog</h1>
        <p>Seu catálogo de filmes</p>
      </section>

      <section className="catalog">
        <h2>Filmes disponíveis</h2>

        <div className="movie-row">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onFavorite={handleFavorite}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default Home;