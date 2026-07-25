import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getMovieById, addReview } from "../services/api";

function MovieDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  function handleBack() {
    if (location.state?.from) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }

  const [movie, setMovie] = useState(null);
  const [erro, setErro] = useState("");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  function showMessage(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  }

  useEffect(() => {
    getMovieById(id)
      .then(setMovie)
      .catch(() => setErro("Erro ao carregar detalhes do filme"));
  }, [id]);

  async function handleSubmitReview(e) {
    e.preventDefault();

    if (rating === 0) {
      showMessage("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    try {
      await addReview(movie.id, rating, comment);
      showMessage("Avaliação enviada com sucesso!");
      setRating(0);
      setComment("");
    } catch (error) {
      showMessage("Não foi possível enviar a avaliação.");
      console.error(error);
    }
  }

  if (erro) {
    return (
      <main className="details-page">
        <p>{erro}</p>
        <button onClick={handleBack} className="back-button">
          Voltar
        </button>
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
      {message && <div className="toast" role="status">{message}</div>}

      <button onClick={handleBack} className="back-button">
        Voltar
      </button>

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
            {detalhes.map(([label, value]) =>
              value && (
                <p key={label}>
                  <strong>{label}:</strong> {value}
                </p>
              )
            )}
          </div>

          <p className="details-description">
            <strong>Descrição:</strong><br />
            {movie.description || "Sem descrição disponível."}
          </p>
        </div>
      </section>

      <section className="review-form-section">
        <h2>Avaliar filme</h2>

        <form onSubmit={handleSubmitReview} className="review-form">
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className={star <= rating ? "star active" : "star"}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            placeholder="Escreva sua avaliação..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button type="submit" className="review-submit-button">
            Enviar avaliação
          </button>
        </form>
      </section>
    </main>
  );
}

export default MovieDetails;
