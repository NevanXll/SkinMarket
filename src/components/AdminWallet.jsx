import { useEffect, useState } from "react";
import { money } from "../lib/market";
import { api } from "../services/api";

function PackagePrice({ pack }) {
  const [savedPrice, setSavedPrice] = useState(pack.priceUsd);
  const [price, setPrice] = useState(String(pack.priceUsd));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const label = `${money(pack.credits)} USD de saldo`;

  async function save(event) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");
    try {
      const updated = await api(`/admin/wallet/packages/${pack.id}`, {
        method: "PUT", body: { priceUsd: Number(price) },
      });
      setSavedPrice(updated.priceUsd);
      setPrice(String(updated.priceUsd));
      setMessage("Precio actualizado.");
    } catch (failure) {
      setError(failure.fields?.priceUsd || failure.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="order-card admin-wallet-package" onSubmit={save}>
      <h3>{label}</h3>
      <label>
        Precio simulado en USD
        <input className="form-control" type="number" required min="0.01" max="100000" step="0.01"
          aria-label={`Precio en USD para ${label}`} disabled={pending} value={price}
          onChange={(event) => { setPrice(event.target.value); setMessage(""); setError(""); }} />
      </label>
      <p className="muted">Precio vigente en CLP: {money(savedPrice, "CLP")}</p>
      <button className="button secondary" disabled={pending || Number(price) === savedPrice}>
        {pending ? "Guardando…" : "Guardar precio"}
      </button>
      {message && <p role="status">{message}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </form>
  );
}

export default function AdminWallet() {
  const [packages, setPackages] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api("/wallet/packages", { signal: controller.signal })
      .then(setPackages)
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, []);

  return (
    <section aria-labelledby="admin-wallet-title">
      <h2 id="admin-wallet-title">Paquetes de recarga</h2>
      <p className="muted">Ajusta el precio simulado de cada paquete. El saldo que entrega se mantiene fijo.</p>
      {error && <p role="alert" className="field-error">{error}</p>}
      {!packages && !error && <p role="status">Consultando paquetes…</p>}
      {packages && <div className="admin-wallet-grid">
        {packages.map((pack) => <PackagePrice key={pack.id} pack={pack} />)}
      </div>}
    </section>
  );
}
