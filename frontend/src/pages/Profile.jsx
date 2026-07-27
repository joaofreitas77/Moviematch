import { useEffect, useRef, useState } from "react";
import UserAvatar from "../components/UserAvatar";
import { applyTheme, getCurrentUser, updateProfile } from "../services/api";

function prepareAvatar(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Escolha um arquivo de imagem."));
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const size = Math.min(image.naturalWidth, image.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = 384;
      canvas.height = 384;
      const context = canvas.getContext("2d");
      context.drawImage(
        image,
        (image.naturalWidth - size) / 2,
        (image.naturalHeight - size) / 2,
        size,
        size,
        0,
        0,
        384,
        384,
      );
      URL.revokeObjectURL(objectUrl);
      let quality = 0.82;
      let result = canvas.toDataURL("image/jpeg", quality);
      const approximateBytes = (dataUrl) => Math.ceil((dataUrl.split(",")[1]?.length || 0) * 0.75);
      while (approximateBytes(result) > 180 * 1024 && quality > 0.46) {
        quality -= 0.08;
        result = canvas.toDataURL("image/jpeg", quality);
      }
      if (approximateBytes(result) > 500 * 1024) {
        reject(new Error("Não foi possível reduzir esta foto. Escolha outra imagem."));
        return;
      }
      resolve(result);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível processar esta imagem."));
    };
    image.src = objectUrl;
  });
}

function Profile() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [draftAvatar, setDraftAvatar] = useState(null);
  const [draftTheme, setDraftTheme] = useState("dark");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const fileInputRef = useRef(null);

  useEffect(() => {
    getCurrentUser().then((data) => {
      setUser(data);
      setEmail(data.email || "");
      setDraftAvatar(data.avatar || "");
      setDraftTheme(data.theme);
      applyTheme(data.theme);
    }).catch(() => notify("Não foi possível carregar seu perfil.", "error"));
  }, []);

  function notify(text, type = "success") {
    setMessage(text);
    setMessageType(type);
    window.setTimeout(() => setMessage(""), 4000);
  }

  async function saveChanges() {
    const changes = {};
    const normalizedEmail = email.trim().toLowerCase();
    const emailChanged = normalizedEmail !== (user.email || "").toLowerCase();
    const passwordChanged = Boolean(newPassword);

    if (passwordChanged && newPassword.length < 6) {
      return notify("A nova senha deve ter pelo menos 6 caracteres.", "error");
    }
    if (passwordChanged && newPassword !== confirmPassword) {
      return notify("A confirmação da senha não confere.", "error");
    }
    if ((emailChanged || passwordChanged) && !currentPassword) {
      return notify("Informe sua senha atual para salvar alterações de segurança.", "error");
    }

    if (emailChanged) changes.email = normalizedEmail;
    if (passwordChanged) changes.new_password = newPassword;
    if (emailChanged || passwordChanged) changes.current_password = currentPassword;
    if (draftAvatar !== (user.avatar || "")) changes.avatar = draftAvatar;
    if (draftTheme !== user.theme) changes.theme = draftTheme;

    if (!Object.keys(changes).length) return notify("Nenhuma alteração para salvar.", "error");

    setSaving(true);
    try {
      const updated = await updateProfile(changes);
      setUser(updated);
      setEmail(updated.email || "");
      setDraftAvatar(updated.avatar || "");
      setDraftTheme(updated.theme);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify("Alterações do perfil salvas com sucesso.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const avatar = await prepareAvatar(file);
      setDraftAvatar(avatar);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      event.target.value = "";
    }
  }

  if (!user) return <main className="page profile-page" />;

  const previewUser = { ...user, avatar: draftAvatar };
  const hasChanges = (
    email.trim().toLowerCase() !== (user.email || "").toLowerCase()
    || draftAvatar !== (user.avatar || "")
    || draftTheme !== user.theme
    || Boolean(newPassword)
  );

  return (
    <main className="page profile-page">
      {message && <div className={`toast ${messageType === "error" ? "error-toast" : ""}`} role="status">{message}</div>}
      <section className="profile-heading">
        <div>
          <span className="section-eyebrow">SUA CONTA</span>
          <h1>Configurações do perfil</h1>
          <p>Gerencie como você aparece no CineLog, proteja sua conta e escolha a aparência do sistema.</p>
        </div>
        <button type="button" className="profile-save-button" disabled={!hasChanges || saving} onClick={saveChanges}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </section>

      <div className="profile-settings-layout">
        <aside className="profile-summary">
          <UserAvatar user={previewUser} className="profile-page-avatar" />
          <strong>{user.username}</strong>
          <span>{user.email || "E-mail não informado"}</span>
          {user.is_staff && <small>Administrador</small>}
        </aside>

        <div className="profile-settings-content">
          <section className="settings-card" id="profile-photo">
            <div className="settings-card-heading">
              <div><span>PERFIL</span><h2>Foto de perfil</h2></div>
              <p>JPG, PNG ou WebP. A imagem será recortada e comprimida para ocupar menos espaço.</p>
            </div>
            <div className="avatar-settings-row">
              <UserAvatar user={previewUser} className="settings-avatar-preview" />
              <div className="avatar-settings-actions">
                <button type="button" className="primary-settings-button" onClick={() => fileInputRef.current?.click()}>Escolher foto</button>
                {draftAvatar && <button type="button" className="subtle-settings-button" onClick={() => setDraftAvatar("")}>Remover foto</button>}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleAvatar} />
              </div>
            </div>
          </section>

          <section className="settings-card" id="security">
            <div className="settings-card-heading">
              <div><span>SEGURANÇA</span><h2>E-mail da conta</h2></div>
              <p>Usado para identificar e recuperar sua conta futuramente.</p>
            </div>
            <div className="settings-form">
              <label><span>Novo e-mail</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
              <label><span>Senha atual</span><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" placeholder="Obrigatória para e-mail ou senha" /></label>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <div><span>SEGURANÇA</span><h2>Alterar senha</h2></div>
              <p>Use pelo menos 6 caracteres e evite reutilizar senhas.</p>
            </div>
            <div className="settings-form password-settings-form">
              <label><span>Nova senha</span><input type="password" required minLength="6" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" /></label>
              <label><span>Confirmar nova senha</span><input type="password" required minLength="6" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" /></label>
            </div>
          </section>

          <section className="settings-card" id="appearance">
            <div className="settings-card-heading">
              <div><span>APARÊNCIA</span><h2>Tema do CineLog</h2></div>
              <p>A preferência fica vinculada à sua conta.</p>
            </div>
            <div className="theme-options" role="radiogroup" aria-label="Tema do sistema">
              <button type="button" role="radio" aria-checked={draftTheme === "dark"} className={draftTheme === "dark" ? "selected" : ""} onClick={() => setDraftTheme("dark")}>
                <span className="theme-preview dark-preview"><i /><i /></span><strong>Escuro</strong><small>Visual original do CineLog</small>
              </button>
              <button type="button" role="radio" aria-checked={draftTheme === "light"} className={draftTheme === "light" ? "selected" : ""} onClick={() => setDraftTheme("light")}>
                <span className="theme-preview light-preview"><i /><i /></span><strong>Claro</strong><small>Branco, cinza e vermelho</small>
              </button>
            </div>
          </section>
          <div className="profile-save-footer">
            <span>{hasChanges ? "Você possui alterações não salvas." : "Seu perfil está atualizado."}</span>
            <button type="button" className="profile-save-button" disabled={!hasChanges || saving} onClick={saveChanges}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Profile;
