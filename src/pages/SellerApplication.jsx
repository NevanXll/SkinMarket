import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useMarket } from "../context/MarketContext";

export default function SellerApplication() {
  const { user, refreshAccount } = useMarket();
  const navigate = useNavigate();
  const [application, setApplication] = useState(undefined);
  const [experience, setExperience] = useState("");
  const [reason, setReason] = useState("");
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

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      setApplication(await api("/seller-application", {
        method: "POST",
        body: { reason: reason.trim(), experience: experience.trim() },
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
    <div className="page-container">
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
        <form className="order-card" onSubmit={submit}>
          <label className="d-block mb-3">
            Motivo para solicitar el rol
            <textarea className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} minLength={10} maxLength={1000} required />
          </label>
          <label className="d-block mb-3">
            Experiencia o contexto (opcional)
            <textarea className="form-control" value={experience} onChange={(e) => setExperience(e.target.value)} maxLength={500} />
          </label>
          <button className="button" disabled={busy}>Enviar solicitud</button>
        </form>
      )}
    </div>
  );
}
