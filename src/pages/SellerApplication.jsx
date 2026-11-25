import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useMarket } from "../context/MarketContext";

export default function SellerApplication() {
  const { user, refreshAccount } = useMarket();
  const navigate = useNavigate();
  const [application, setApplication] = useState(undefined);
  const [skins, setSkins] = useState("");
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
        body: { skins: skins.trim(), reason: reason.trim() },
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
        <h1>Postulación a vendedor</h1>
        <p>Indica qué skins tienes y por qué quieres venderlas. Un administrador revisará tu solicitud.</p>
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
            Skins que quieres vender
            <textarea className="form-control" value={skins} onChange={(e) => setSkins(e.target.value)} minLength={3} maxLength={500} required />
          </label>
          <label className="d-block mb-3">
            Motivo de la solicitud
            <textarea className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} minLength={10} maxLength={1000} required />
          </label>
          <button className="button" disabled={busy}>Enviar solicitud</button>
        </form>
      )}
    </div>
  );
}
