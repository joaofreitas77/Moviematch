import { useEffect, useState } from "react";
import { getCurrentUser, sendSupportRequest } from "../services/api";

const initialForm = {
  category: "technical",
  subject: "",
  email: "",
  message: "",
};

function Support() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    getCurrentUser()
      .then((user) => setForm((current) => ({ ...current, email: user.email || "" })))
      .catch(() => {});
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await sendSupportRequest(form);
      setFeedback({ type: "success", text: response.message });
      setForm((current) => ({ ...initialForm, email: current.email }));
    } catch (error) {
      setFeedback({ type: "error", text: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page support-page">
      <section className="support-heading">
        <span className="section-eyebrow">ESTAMOS AQUI PARA AJUDAR</span>
        <h1>Suporte e contato</h1>
        <p>Encontrou algum problema, ou tem uma ideia para melhorar o CineLog? Fale diretamente com nossa equipe.</p>
      </section>

      <section className="support-layout">
        <aside className="support-info">
          <div className="support-info-icon" aria-hidden="true">?</div>
          <h2>Como podemos ajudar?</h2>
          <p>Escolha o assunto que melhor descreve sua mensagem. Isso ajuda a organizar e agilizar o atendimento.</p>
          <ul>
            <li><span>01</span><div><strong>Conte o que aconteceu</strong><small>Inclua detalhes que ajudem a entender sua solicitação.</small></div></li>
            <li><span>02</span><div><strong>Confira seu e-mail</strong><small>A resposta será enviada para o endereço informado.</small></div></li>
            <li><span>03</span><div><strong>Envie sua mensagem</strong><small>Ela seguirá diretamente para a administração do CineLog.</small></div></li>
          </ul>
        </aside>

        <form className="support-form" onSubmit={handleSubmit}>
          <div className="support-form-heading">
            <div><span className="section-eyebrow">NOVA SOLICITAÇÃO</span><h2>Envie uma mensagem</h2></div>
            <span className="support-secure-badge">Envio protegido</span>
          </div>

          {feedback && <p className={`support-feedback ${feedback.type}`} role="status">{feedback.text}</p>}

          <label>
            Categoria
            <select name="category" value={form.category} onChange={updateField} required>
              <option value="technical">Problema técnico</option>
              <option value="suggestion">Sugestão de melhoria</option>
              <option value="account">Conta e acesso</option>
              <option value="catalog">Filmes e catálogo</option>
              <option value="other">Outro assunto</option>
            </select>
          </label>

          <label>
            Assunto
            <input name="subject" value={form.subject} onChange={updateField} minLength="5" maxLength="120" placeholder="Resuma sua solicitação" required />
          </label>

          <label>
            E-mail para retorno
            <input type="email" name="email" value={form.email} onChange={updateField} placeholder="voce@exemplo.com" required />
            <small>Usaremos este endereço somente para responder à sua solicitação.</small>
          </label>

          <label>
            Mensagem
            <textarea name="message" value={form.message} onChange={updateField} minLength="20" maxLength="3000" placeholder="Descreva sua dúvida, problema ou sugestão com detalhes..." required />
            <small className="character-count">{form.message.length}/3000</small>
          </label>

          <button type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Enviar mensagem"}</button>
        </form>
      </section>
    </main>
  );
}

export default Support;
