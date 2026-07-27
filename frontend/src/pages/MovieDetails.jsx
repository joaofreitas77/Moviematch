import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getMovieById, addReview, getMovieReviews } from "../services/api";

function getYouTubeEmbedUrl(url) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    let videoId = null;

    if (parsedUrl.hostname.includes("youtu.be")) {
      videoId = parsedUrl.pathname.slice(1);
    } else if (parsedUrl.hostname.includes("youtube.com")) {
      videoId = parsedUrl.searchParams.get("v") || parsedUrl.pathname.split("/embed/")[1];
    }

    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

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
  const [reviews, setReviews] = useState([]);
  const [erro, setErro] = useState("");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  function showMessage(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  }

  useEffect(() => {
    Promise.all([getMovieById(id), getMovieReviews(id)])
      .then(([movieData, reviewData]) => {
        setMovie(movieData);
        setReviews(reviewData);
      })
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
      setReviews(await getMovieReviews(movie.id));
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
  const trailerEmbedUrl = getYouTubeEmbedUrl(movie.trailer_url);

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

      {trailerEmbedUrl && (
        <section className="trailer-section">
          <div className="trailer-heading">
            <div>
              <span className="section-eyebrow">ASSISTA AGORA</span>
              <h2>Trailer oficial</h2>
            </div>
            <a href={movie.trailer_url} target="_blank" rel="noreferrer">Abrir no YouTube ↗</a>
          </div>
          <div className="trailer-player">
            <iframe
              src={trailerEmbedUrl}
              title={`Trailer oficial de ${movie.tittle}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </section>
      )}

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

      <section className="movie-reviews-section">
        <div className="movie-reviews-heading">
          <div>
            <span className="section-eyebrow">OPINIÕES DA COMUNIDADE</span>
            <h2>Avaliações de {movie.tittle}</h2>
          </div>
          <span>{reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}</span>
        </div>

        {reviews.length ? (
          <div className="movie-review-list">
            {reviews.map((review) => (
              <article className="movie-review-item" key={review.id}>
                <div className="movie-review-user">
                  <span className="review-avatar" aria-hidden="true">
                    {(review.username || "U").slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <strong>{review.username || "Usuário"}</strong>
                    <small>{new Date(review.created_at).toLocaleDateString("pt-BR")}</small>
                  </div>
                </div>
                <p className="review-stars" aria-label={`${review.rating} de 5 estrelas`}>
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </p>
                <p>{review.comment || "Sem comentário."}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-panel">
            <strong>Ainda não há avaliações.</strong>
            <p>Seja a primeira pessoa a compartilhar uma opinião sobre este filme.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default MovieDetails;
