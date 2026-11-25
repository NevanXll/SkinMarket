import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useMarket } from "../context/MarketContext";
import { imageUrl } from "../lib/market";

export default function SellerApplication() {
  const { user, refreshAccount } = useMarket();
  const navigate = useNavigate();
  const [application, setApplication] = useState(undefined);
  const [experience, setExperience] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState({
    studies: "", institution: "", country: "", region: "", city: "", postalCode: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const current = await api("/seller-application");
    setApplication(current);
    return current;
  }

  useEffect(() => {
    if (user.role === "client") load().catch((failure) => setError(failure.message));
  }, [user.id, user.role]);

  function change(key, value) {
    setDetails((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const postalCode = details.postalCode.trim();
    if (!/^[\p{L}\p{N} -]{0,16}$/u.test(postalCode)) {
      setError("El código postal admite letras, números, espacios y guiones.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      setApplication(await api("/seller-application", {
        method: "POST",
        body: {
          reason: reason.trim(), experience: experience.trim(), studies: details.studies === "yes",
          institution: details.studies === "yes" ? details.institution.trim() : "",
          country: details.country.trim(), region: details.region.trim(), city: details.city.trim(),
          postalCode,
        },
      }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setBusy(true);
    setError("");
    try {
      if ((await load())?.status === "APROBADA") {
        await refreshAccount();
        navigate("/vendedor", { replace: true });
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  if (user.role === "seller") return <Navigate to="/vendedor" replace />;

  const status = application?.status;
  return (
    <div className="page-container account-page">
      <img className="account-backdrop" src={imageUrl("images/skins/skin-63c1d72b8501.png")} alt="" />
      <div className="page-heading">
        <h1>Solicitar rol Vendedor</h1>
        <p>Cuéntanos por qué quieres obtener este rol. Un administrador revisará tu postulación.</p>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      {application === undefined && !error && <p role="status">Consultando solicitud…</p>}
      {(application || error) && <div className="order-card">
        {status && <p role="status">Estado: {{ PENDIENTE: "En revisión", APROBADA: "Aprobada", RECHAZADA: "Rechazada" }[status]}</p>}
        {application?.reviewNote && <p>Comentario del administrador: {application.reviewNote}</p>}
        <button className="button secondary" disabled={busy} onClick={refresh}>
          {status === "APROBADA" ? "Abrir panel de vendedor" : "Actualizar estado"}
        </button>
      </div>}
      {(application === null || status === "RECHAZADA") && (
        <form className="order-card seller-form" onSubmit={submit}>
          <label>
            Motivo para solicitar el rol
            <textarea className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} minLength={10} maxLength={1000} required />
          </label>
          <label>
            Experiencia o contexto (opcional)
            <textarea className="form-control" value={experience} onChange={(e) => setExperience(e.target.value)} maxLength={500} />
          </label>
          <fieldset>
            <legend>Estudios</legend>
            <label>
              ¿Estudias actualmente?
              <select className="form-select" value={details.studies}
                onChange={(e) => change("studies", e.target.value)} required>
                <option value="">Selecciona una opción</option>
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </label>
            {details.studies === "yes" && <label>
              Institución educativa (opcional)
              <input className="form-control" value={details.institution}
                onChange={(e) => change("institution", e.target.value)} maxLength={120} />
            </label>}
          </fieldset>
          <fieldset>
            <legend>Ubicación</legend>
            {[
              ["country", "País", 80],
              ["region", "Estado, región o provincia", 100],
              ["city", "Ciudad", 100],
            ].map(([key, label, maxLength]) => (
              <label key={key}>
                {label}
                <input className="form-control" value={details[key]}
                  onChange={(e) => change(key, e.target.value)} maxLength={maxLength} required />
              </label>
            ))}
            <label>
              Código postal (si aplica)
              <input className="form-control" value={details.postalCode}
                onChange={(e) => change("postalCode", e.target.value)} maxLength={16} />
            </label>
          </fieldset>
          <p className="muted mb-0">Estos datos quedan en tu solicitud y se muestran al equipo administrador que la revisa.</p>
          <button className="button" disabled={busy}>Enviar solicitud</button>
        </form>
      )}
    </div>
  );
}
