import { useEffect, useState } from "react";
import { getReviews, getMovieById } from "../services/api";
import "../styles/global.css";

function RecentReviews() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    getReviews()
      .then((data) => Promise.all(
        data.map(async (review) => ({
          ...review,
          movieData: await getMovieById(review.movie),
        }))
      ))
      .then(setReviews)
      .catch(console.error);
  }, []);

  return (
    <main className="page">
      <section className="catalog">
        <h2>Avaliações Recentes</h2>

        <div className="reviews-list">
          {reviews.map((review) => (
            <div className="review-card" key={review.id}>
              <img
                src={
                  review.movieData.poster ||
                  "https://via.placeholder.com/300x450?text=Sem+Poster"
                }
                alt={review.movieData.tittle}
              />

              <div>
                <h3>{review.movieData.tittle}</h3>

                <p className="review-user">
                  Avaliado por: {review.username || "Usuário"}
                </p>

                <p className="review-stars">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </p>

                <p>{review.comment || "Sem comentário."}</p>

                <span>
                  {new Date(review.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default RecentReviews;
