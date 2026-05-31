import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMovieById } from "../services/api";

function MovieDetails() {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    getMovieById(id)
      .then(setMovie)
      .catch(() => setErro("Erro ao carregar detalhes do filme"));
  }, [id]);

  if (erro) {
    return (
      <main className="details-page">
        <p>{erro}</p>
        <Link to="/" className="back-button">Voltar ao catálogo</Link>
      </main>
    );
  }

  if (!movie) {
    return (
      <main className="details-page">
        <p>Carregando...</p>
      </main>
    );
  }

  const detalhes = [
    ["Duração", movie.runtime],
    ["Diretor", movie.director],
    ["Roteirista", movie.writer],
    ["Atores", movie.actors],
    ["Idioma", movie.language],
    ["País", movie.country],
    ["Prêmios", movie.awards],
    ["IMDb", movie.imdb_rating],
    ["Votos IMDb", movie.imdb_votes],
    ["Metascore", movie.metascore],
    ["Classificação", movie.rated],
    ["Lançamento", movie.released],
  ];

  return (
    <main className="details-page">
      <Link to="/" className="back-button">Voltar ao catálogo</Link>

      <section className="details-container">
        <img
          className="details-poster"
          src={movie.poster || "https://via.placeholder.com/300x450?text=Sem+Poster"}
          alt={movie.tittle}
        />

        <div className="details-info">
          <h1>{movie.tittle}</h1>

          <div className="details-meta">
            <span>{movie.realese_year}</span>
            <span>{movie.type}</span>
            <span>{movie.genre}</span>
          </div>

          <div className="details-list">
            {detalhes.map(([label, value]) => (
              value && (
                <p key={label}>
                  <strong>{label}:</strong> {value}
                </p>
              )
            ))}
          </div>

          <p className="details-description">
            <strong>Descrição:</strong><br />
            {movie.description || "Sem descrição disponível."}
          </p>
        </div>
      </section>
    </main>
  );
}

export default MovieDetails;