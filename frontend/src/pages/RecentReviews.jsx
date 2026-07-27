import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCurrentUser,
  getReviews,
  removeReview,
  updateReview,
} from "../services/api";
import UserAvatar from "../components/UserAvatar";

function RecentReviews() {
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([getReviews(), getCurrentUser()])
      .then(([data, currentUser]) => {
        setReviews(data);
        setUser(currentUser);
      })
      .catch(() => setMessage("Não foi possível carregar as avaliações."));
  }, []);

  function notify(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  }

  function beginEdit(review) {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
    setDeleteConfirmId(null);
  }

  async function saveEdit(reviewId) {
    try {
      const updated = await updateReview(reviewId, editRating, editComment);
      setReviews((current) => current.map((review) => review.id === reviewId
        ? { ...review, rating: updated.rating, comment: updated.comment }
        : review));
      setEditingId(null);
      notify("Avaliação atualizada.");
    } catch (error) {
      notify(error.message);
    }
  }

  async function handleRemove(reviewId) {
    if (deleteConfirmId !== reviewId) {
      setDeleteConfirmId(reviewId);
      return;
    }

    try {
      await removeReview(reviewId);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
      setDeleteConfirmId(null);
      notify("Avaliação removida.");
    } catch (error) {
      notify(error.message);
    }
  }

  return (
    <main className="page reviews-page">
      {message && <div className="toast" role="status">{message}</div>}
      <section className="reviews-heading">
        <span className="section-eyebrow">COMUNIDADE CINELOG</span>
        <h1>Avaliações recentes</h1>
        <p>Veja o que os usuários estão assistindo e compartilhe suas impressões.</p>
      </section>

      <section className="reviews-content">
        <div className="reviews-list">
          {reviews.map((review) => {
            const isAuthor = user?.id === review.user;
            const canRemove = isAuthor || user?.is_staff;
            const isEditing = editingId === review.id;

            return (
              <article className="review-card" key={review.id}>
                {review.can_access_movie ? (
                  <Link to={`/movies/${review.accessible_movie_id}`} className="review-poster-link">
                    <img src={review.movie_poster || "https://placehold.co/300x450/202024/e5e5e5?text=Sem+poster"} alt={review.movie_title} />
                  </Link>
                ) : (
                  <div
                    className="review-poster-link private-review-poster"
                    tabIndex="0"
                    data-tooltip={'Não pode ser visto porque não está no seu catálogo. Adicione em "Meus filmes" para acessar os detalhes.'}
                    aria-label={'Filme privado. Não pode ser visto porque não está no seu catálogo. Adicione em "Meus filmes" para acessar os detalhes.'}
                  >
                    <img src={review.movie_poster || "https://placehold.co/300x450/202024/e5e5e5?text=Sem+poster"} alt={review.movie_title} />
                    <span aria-hidden="true">Privado</span>
                  </div>
                )}

                <div className="review-card-content">
                  <div className="review-card-top">
                    <div>
                      <h3>{review.movie_title}</h3>
                      <div className="review-author-line">
                        <UserAvatar user={{ username: review.username, avatar: review.user_avatar }} className="review-author-avatar" />
                        <p className="review-user">Avaliado por: {review.username || "Usuário"}</p>
                      </div>
                      {review.movie_is_private && !review.can_access_movie && <p className="private-review-note">Privado · adicione em “Meus filmes” para acessar</p>}
                    </div>
                    {(isAuthor || canRemove) && <div className="review-actions">
                      {isAuthor && !isEditing && <button onClick={() => beginEdit(review)}>Editar</button>}
                      {canRemove && <button className={deleteConfirmId === review.id ? "confirm-delete" : ""} onClick={() => handleRemove(review.id)}>
                        {deleteConfirmId === review.id ? "Confirmar exclusão" : "Remover"}
                      </button>}
                    </div>}
                  </div>

                  {isEditing ? <div className="review-edit-form">
                    <div className="stars edit-stars">{[1,2,3,4,5].map((star) => <button type="button" key={star} onClick={() => setEditRating(star)} className={star <= editRating ? "star active" : "star"}>★</button>)}</div>
                    <textarea value={editComment} onChange={(event) => setEditComment(event.target.value)} placeholder="Atualize seu comentário..." />
                    <div><button className="save-review-button" onClick={() => saveEdit(review.id)}>Salvar alterações</button><button className="cancel-edit-button" onClick={() => setEditingId(null)}>Cancelar</button></div>
                  </div> : <>
                    <p className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                    <p>{review.comment || "Sem comentário."}</p>
                    <span>{new Date(review.created_at).toLocaleDateString("pt-BR")}</span>
                  </>}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default RecentReviews;
