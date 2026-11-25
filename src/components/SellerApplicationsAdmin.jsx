import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function SellerApplicationsAdmin() {
  const [applications, setApplications] = useState(null);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState(null);

  useEffect(() => {
    api("/admin/seller-applications").then(setApplications).catch((failure) => setError(failure.message));
  }, []);

  async function review(event, application) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const approved = event.nativeEvent.submitter.value === "approve";
    const note = form.get("note").trim();
    if (!approved && !note) {
      setError("Indica el motivo del rechazo.");
      return;
    }
    setReviewing(application.userId);
    setError("");
    try {
      const updated = await api(`/admin/seller-applications/${encodeURIComponent(application.userId)}`, {
        method: "PUT", body: { approved, note },
      });
      setApplications((rows) => rows.map((row) => row.userId === updated.userId ? updated : row));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setReviewing(null);
    }
  }

  return (
    <section className="orders-list" aria-label="Solicitudes de vendedor">
      {error && <p className="field-error" role="alert">{error}</p>}
      {!applications && !error && <p role="status">Cargando solicitudes…</p>}
      {applications?.length === 0 && <p className="empty-state">Todavía no hay solicitudes de vendedor.</p>}
      {applications?.map((application) => (
        <article className="order-card text-break" key={application.userId}>
          <h2>{application.name}</h2>
          <p>{application.email}</p>
          <p><strong>Motivo:</strong> {application.reason}</p>
          {application.experience && <p><strong>Experiencia:</strong> {application.experience}</p>}
          <p>Estado: {{ PENDIENTE: "En revisión", APROBADA: "Aprobada", RECHAZADA: "Rechazada" }[application.status]}</p>
          {application.reviewNote && <p>Comentario: {application.reviewNote}</p>}
          {application.status === "PENDIENTE" && (
            <form onSubmit={(event) => review(event, application)}>
              <label className="d-block mb-3">Comentario de la revisión
                <textarea className="form-control" name="note" maxLength={500} />
              </label>
              <div className="d-flex flex-wrap gap-2">
                <button className="button" value="approve" disabled={reviewing !== null}>Aprobar</button>
                <button className="button secondary" value="reject" disabled={reviewing !== null}>Rechazar</button>
              </div>
            </form>
          )}
        </article>
      ))}
    </section>
  );
}
