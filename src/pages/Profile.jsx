import { useState } from "react";
import ProfileAvatar, { avatarOptions } from "../components/ProfileAvatar";
import { useMarket } from "../context/MarketContext";

export default function Profile() {
  const { user, saveProfile } = useMarket();
  const [form, setForm] = useState(() => ({
    name: user.name,
    bio: user.bio ?? "",
    avatar: user.avatar ?? "initial",
    showEmail: user.showEmail ?? false,
    showHeaderBalance: user.showHeaderBalance ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const name = form.name.trim();
    if (name.length < 3) {
      setError("El nombre visible debe tener al menos 3 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const bio = form.bio.trim();
      await saveProfile({ ...form, name, bio });
      setForm((current) => ({ ...current, name, bio }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-heading">
        <h1>Mi perfil</h1>
        <p>Personaliza tu cuenta y elige qué datos aparecen en pantalla.</p>
      </div>
      <form className="profile-settings" onSubmit={submit}>
        <section className="order-card">
          <div className="profile-preview">
            <ProfileAvatar name={form.name} avatar={form.avatar} />
            <div>
              <h2>Personalización</h2>
              <p>{user.name}</p>
              {user.showEmail && <p>{user.email}</p>}
            </div>
          </div>
          <div className="profile-fields">
            <label htmlFor="profile-name">Nombre visible</label>
            <input id="profile-name" className="form-control" value={form.name}
              onChange={(e) => change("name", e.target.value)} minLength={3} maxLength={100} required />
            <label htmlFor="profile-bio">Sobre mí</label>
            <textarea id="profile-bio" className="form-control" value={form.bio}
              onChange={(e) => change("bio", e.target.value)} rows={4} maxLength={240} />
            <fieldset>
              <legend>Avatar</legend>
              <div className="avatar-options">
                {avatarOptions.map(([value, label]) => (
                  <label key={value}>
                    <input type="radio" name="avatar" value={value} checked={form.avatar === value}
                      onChange={() => change("avatar", value)} />
                    <ProfileAvatar name={form.name} avatar={value} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </section>
        <section className="order-card profile-privacy">
          <h2>Privacidad en pantalla</h2>
          <label><input type="checkbox" checked={form.showEmail}
            onChange={(e) => change("showEmail", e.target.checked)} /> Mostrar mi correo en Mi perfil</label>
          <label><input type="checkbox" checked={form.showHeaderBalance}
            onChange={(e) => change("showHeaderBalance", e.target.checked)} /> Mostrar mi saldo en el encabezado</label>
          <p className="muted">El saldo sigue disponible en el carrito al confirmar una compra.</p>
        </section>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="button" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
      </form>
    </div>
  );
}
