import { useEffect, useState } from "react";
import { getMovies, addFavorite } from "../services/api";
import MovieCard from "../components/MovieCard";
import "../styles/global.css";

function Home() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");

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

  const filteredMovies = movies.filter((movie) =>
    movie.tittle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="page">
      <section className="banner">
        <h1>CineLog</h1>
        <p>Seu catálogo de filmes</p>
      </section>

      <section className="catalog">
        <div className="catalog-header">
          <h2>Filmes disponíveis</h2>

          <input
            className="search-input"
            type="text"
            placeholder="Pesquisar filme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="movie-row">
          {filteredMovies.length > 0 ? (
            filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onFavorite={handleFavorite}
              />
            ))
          ) : (
            <p>Nenhum filme encontrado.</p>
          )}
        </div>
      </section>
    </main>
  );
}

export default Home;