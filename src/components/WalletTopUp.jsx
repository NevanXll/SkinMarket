import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createId } from "../lib/id";
import { money } from "../lib/market";
import { api } from "../services/api";
import Modal from "./Modal";

function formatted(amount, currency) {
  return `${money(amount, currency)} ${currency}`;
}

export default function WalletTopUp({ currency, topUp, onClose }) {
  const [packages, setPackages] = useState(null);
  const [selection, setSelection] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const otherCurrency = currency === "CLP" ? "USD" : "CLP";

  useEffect(() => {
    const controller = new AbortController();
    api("/wallet/packages", { signal: controller.signal })
      .then(setPackages)
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!selection || pending) return;
    setPending(true);
    setError("");
    try {
      await topUp(selection.option, selection.requestKey);
      onClose();
    } catch (failure) {
      setError(failure.message);
      if (failure.status === 409) {
        setSelection(null);
        setPackages(null);
        try {
          setPackages(await api("/wallet/packages"));
        } catch (reloadFailure) {
          setError(reloadFailure.message);
        }
      }
      setPending(false);
    }
  }

  return (
    <Modal onClose={() => { if (!pending) onClose(); }}>
      <section className="market-modal wallet-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-title">
        <button type="button" className="icon-button modal-close" aria-label="Cerrar recarga" onClick={onClose} disabled={pending}>
          <X />
        </button>
        <h2 id="wallet-title">Recargar saldo</h2>
        <p>Elige un monto para tu billetera. Las recargas son virtuales y no generan cobros.</p>
        <form onSubmit={submit}>
          {!packages && !error && <p role="status">Consultando paquetes…</p>}
          {packages && <fieldset className="wallet-options" disabled={pending}>
            <legend>Paquetes de recarga</legend>
            {packages.map((option) => (
              <label className="wallet-option" key={option.id}>
                <input type="radio" name="top-up-amount" value={option.id} checked={selection?.option.id === option.id}
                  onChange={() => setSelection({ option, requestKey: createId() })} />
                <span>
                  <strong>{formatted(option.credits, currency)} de saldo</strong>
                  <small>Precio simulado: {formatted(option.priceUsd, currency)}</small>
                  <small>Equivale a {formatted(option.priceUsd, otherCurrency)}</small>
                </span>
              </label>
            ))}
          </fieldset>}
          {error && <p className="field-error" role="alert">{error}</p>}
          <button className="button" disabled={!selection || pending}>
            {pending ? "Recargando…" : "Añadir saldo virtual"}
          </button>
        </form>
      </section>
    </Modal>
  );
}
