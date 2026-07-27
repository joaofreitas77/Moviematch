import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resendVerification, verifyEmail } from "../services/api";

function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("error");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");
    setSubmitting(true);
    try {
      await verifyEmail(email.trim(), code);
      navigate("/login?verified=1", { replace: true });
    } catch (error) {
      setFeedbackType("error");
      setFeedback(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setFeedback("");
    setSubmitting(true);
    try {
      const result = await resendVerification(email.trim());
      setFeedbackType("success");
      setFeedback(result.message);
      setCode("");
    } catch (error) {
      setFeedbackType("error");
      setFeedback(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card verification-card" onSubmit={handleSubmit}>
        <h1>Confirme seu e-mail</h1>
        <p className="auth-intro">Enviamos um código de 6 dígitos. Digite-o abaixo para ativar sua conta.</p>
        {feedback && <p className={`verification-feedback ${feedbackType}`} role="status">{feedback}</p>}
        <label className="auth-field">
          <span>E-mail cadastrado</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        </label>
        <label className="auth-field">
          <span>Código de confirmação</span>
          <input className="verification-code-input" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" required autoComplete="one-time-code" />
        </label>
        <button type="submit" disabled={submitting || code.length !== 6}>{submitting ? "Confirmando..." : "Confirmar conta"}</button>
        <button className="verification-resend" type="button" disabled={submitting || !email} onClick={handleResend}>Reenviar código</button>
        <p>Digitou o e-mail errado? <Link to="/register">Refazer cadastro</Link></p>
      </form>
    </main>
  );
}

export default VerifyEmail;
