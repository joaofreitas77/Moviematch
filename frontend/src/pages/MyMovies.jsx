import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import { getMyMovies, importMovie, removeMovie } from "../services/api";

function MyMovies() {
  const [movies, setMovies] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  function loadMovies() {
    return getMyMovies().then(setMovies).finally(() => setLoading(false));
  }

  useEffect(() => {
    getMyMovies().then(setMovies).catch(() => setMessage("Não foi possível carregar seus filmes.")).finally(() => setLoading(false));
  }, []);

  function notify(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return notify("Digite o nome de um filme.");

    setSubmitting(true);
    try {
      const result = await importMovie(title.trim());
      notify(result.created ? "Filme adicionado ao seu catálogo." : "Este filme já está no seu catálogo.");
      setTitle("");
      await loadMovies();
    } catch (error) {
      notify(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(movieId) {
    try {
      await removeMovie(movieId);
      setMovies((current) => current.filter((movie) => movie.id !== movieId));
      notify("Filme removido do seu catálogo.");
    } catch (error) {
      notify(error.message);
    }
  }

  return (
    <main className="page private-page">
      {message && <div className="toast" role="status">{message}</div>}
      <section className="private-hero">
        <span className="section-eyebrow">SEU ESPAÇO</span>
        <h1>Meus filmes</h1>
        <p>Monte um catálogo pessoal. Os títulos adicionados aqui ficam visíveis somente para você.</p>

        <form className="movie-import-form" onSubmit={handleSubmit}>
          <label>
            <span>Nome do filme</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Interestelar" disabled={submitting} />
          </label>
          <button type="submit" disabled={submitting}>{submitting ? "Buscando..." : "＋ Adicionar filme"}</button>
        </form>
      </section>

      <section className="private-content">
        <div className="section-heading">
          <div><span className="section-eyebrow">BIBLIOTECA PESSOAL</span><h2>Seus títulos</h2></div>
          <span className="section-count">{movies.length} filmes</span>
        </div>

        {loading ? <div className="inline-loading">Carregando...</div> : movies.length ? (
          <div className="personal-movie-grid">
            {movies.map((movie) => (
              <div key={movie.id} className="personal-movie-item">
                <MovieCard movie={movie} showFavorite={false} />
                <button className="remove-favorite-button" onClick={() => handleRemove(movie.id)}>Remover do catálogo</button>
              </div>
            ))}
          </div>
        ) : <div className="empty-panel"><strong>Seu catálogo ainda está vazio.</strong><p>Pesquise um título acima para adicionar o primeiro filme.</p></div>}
      </section>
    </main>
  );
}

export default MyMovies;
