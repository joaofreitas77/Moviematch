import { Link } from "react-router-dom";

function About() {
  return (
    <main className="page about-page">
      <section className="about-hero">
        <span className="eyebrow">Sobre o CineLog</span>
        <h1>Seu cinema, organizado do seu jeito.</h1>
        <p>O CineLog reúne descoberta, organização e opinião em um só lugar para transformar filmes assistidos, e os que ainda estão na lista, em uma experiência pessoal.</p>
      </section>
      <section className="about-grid" aria-label="O que você pode fazer no CineLog">
        <article><span>01</span><h2>Descubra</h2><p>Explore o catálogo por gêneros e encontre informações, elenco e trailers antes de escolher o próximo título.</p></article>
        <article><span>02</span><h2>Organize</h2><p>Salve favoritos e mantenha uma lista pessoal de títulos que importam para você.</p></article>
        <article><span>03</span><h2>Compartilhe</h2><p>Avalie títulos, registre suas impressões e acompanhe as opiniões mais recentes da comunidade.</p></article>
      </section>
      <section className="about-cta">
        <div><span className="eyebrow">Seu espaço para cinema</span><h2>Descubra, organize e compartilhe sua paixão por filmes/séries.</h2></div>
        <Link to="/home">Explorar catálogo <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}

export default About;
