import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Link } from "react-router-dom";
import ProfileAvatar, { avatarOptions } from "../components/ProfileAvatar";
import { useMarket } from "../context/MarketContext";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];

async function preparePhoto(file) {
  if (!imageTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
    throw new Error("Elige una foto JPG, PNG o WebP de hasta 5 MB.");
  }
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    const side = Math.min(bitmap.width, bitmap.height);
    context.fillStyle = "#111722";
    context.fillRect(0, 0, 256, 256);
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    bitmap.close();
  }
}

export default function Profile() {
  const { user, saveProfile } = useMarket();
  const [form, setForm] = useState(() => ({
    name: user.name,
    bio: user.bio ?? "",
    avatar: user.avatar ?? "initial",
    avatarPhoto: user.avatarPhoto ?? "",
    birthDate: user.birthDate ?? "",
    location: user.location ?? "",
    showEmail: user.showEmail ?? false,
    showHeaderBalance: user.showHeaderBalance ?? true,
    showBirthDate: user.showBirthDate ?? false,
    showLocation: user.showLocation ?? false,
    showHeaderName: user.showHeaderName ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const photoInput = useRef(null);

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function updatePhoto(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setPreparingPhoto(true);
    try {
      change("avatarPhoto", await preparePhoto(file));
    } catch (error) {
      setError(error instanceof DOMException ? "No se pudo leer la foto seleccionada." : error.message);
    } finally {
      setPreparingPhoto(false);
    }
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
            <button type="button" className="profile-photo-control" aria-label="Cambiar foto de perfil"
              aria-describedby="profile-photo-help" title="Cambiar foto de perfil"
              disabled={preparingPhoto || saving} onClick={() => photoInput.current.click()}>
              <ProfileAvatar name={form.name} avatar={form.avatar} photo={form.avatarPhoto} />
              <span className="profile-photo-overlay" aria-hidden="true"><Camera size={22} /></span>
            </button>
            <input ref={photoInput} type="file" hidden aria-label="Subir foto de perfil" accept="image/jpeg,image/png,image/webp"
              onChange={updatePhoto} disabled={preparingPhoto || saving} />
            <span id="profile-photo-help" className="visually-hidden">JPG, PNG o WebP, hasta 5 MB.</span>
            <div>
              <h2>Personalización</h2>
              <p>{user.name}</p>
              {user.showEmail && <p>{user.email}</p>}
              {user.showLocation && user.location && <p>{user.location}</p>}
              {user.showBirthDate && user.birthDate && <p>
                Nacimiento <time dateTime={user.birthDate}>{new Intl.DateTimeFormat("es-CL", {
                  dateStyle: "long", timeZone: "UTC",
                }).format(new Date(user.birthDate + "T00:00:00Z"))}</time>
              </p>}
              {form.avatarPhoto && <button type="button" className="text-button profile-remove-photo"
                onClick={() => change("avatarPhoto", "")}>Quitar foto</button>}
            </div>
          </div>
          <div className="profile-fields">
            <label htmlFor="profile-name">Nombre visible</label>
            <input id="profile-name" className="form-control" value={form.name}
              onChange={(e) => change("name", e.target.value)} minLength={3} maxLength={100} required />
            <label htmlFor="profile-bio">Sobre mí</label>
            <textarea id="profile-bio" className="form-control" value={form.bio}
              onChange={(e) => change("bio", e.target.value)} rows={4} maxLength={240} />
            <label htmlFor="profile-birth-date">Fecha de nacimiento (opcional)</label>
            <input id="profile-birth-date" type="date" className="form-control" value={form.birthDate}
              onChange={(e) => change("birthDate", e.target.value)}
              min="1900-01-01" max={new Date().toISOString().slice(0, 10)} />
            <label htmlFor="profile-location">Ubicación de perfil (opcional)</label>
            <input id="profile-location" className="form-control" value={form.location}
              onChange={(e) => change("location", e.target.value)} placeholder="Ej. Santiago, Chile" maxLength={120} />
            <fieldset>
              <legend>Avatar</legend>
              <div className="avatar-options">
                {avatarOptions.map(([value, label]) => (
                  <label key={value}>
                    <input type="radio" name="avatar" value={value} checked={!form.avatarPhoto && form.avatar === value}
                      onChange={() => setForm((current) => ({ ...current, avatar: value, avatarPhoto: "" }))} />
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
          <label><input type="checkbox" checked={form.showBirthDate}
            onChange={(e) => change("showBirthDate", e.target.checked)} /> Mostrar mi fecha de nacimiento en el resumen</label>
          <label><input type="checkbox" checked={form.showLocation}
            onChange={(e) => change("showLocation", e.target.checked)} /> Mostrar mi ubicación en el resumen</label>
          <label><input type="checkbox" checked={form.showHeaderName}
            onChange={(e) => change("showHeaderName", e.target.checked)} /> Mostrar mi nombre en el encabezado</label>
          <label><input type="checkbox" checked={form.showHeaderBalance}
            onChange={(e) => change("showHeaderBalance", e.target.checked)} /> Mostrar mi saldo en el encabezado</label>
          <p className="muted">El saldo sigue disponible en el carrito al confirmar una compra.</p>
        </section>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="button" disabled={saving || preparingPhoto}>{saving ? "Guardando…" : "Guardar cambios"}</button>
      </form>
      {user.role === "client" && (
        <section className="order-card profile-seller">
          <h2>Ser vendedor</h2>
          <p>Solicita el rol Vendedor o consulta el estado de tu solicitud.</p>
          <Link className="button secondary" to="/vender">Ser vendedor</Link>
        </section>
      )}
    </div>
  );
}
