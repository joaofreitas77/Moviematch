import { useEffect, useState } from "react";
import { getMovies } from "../services/api";
import MovieCard from "../components/MovieCard";
import "../styles/global.css";

function Home() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    getMovies().then(setMovies);
  }, []);

  return (
    <main className="page">
      <section className="banner">
        <h1>MovieMatch</h1>
        <p>Seu catálogo de filmes importados pela OMDb.</p>
      </section>

      <section className="catalog">
        <h2>Filmes disponíveis</h2>

        <div className="movie-row">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default Home;