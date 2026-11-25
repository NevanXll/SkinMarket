import { useState } from "react";
import { X } from "lucide-react";
import { money } from "../lib/market";
import Modal from "./Modal";

const amounts = [500, 1000, 2500, 5000];

function formatted(amount, currency) {
  return `${money(amount, currency)} ${currency}`;
}

export default function WalletTopUp({ currency, topUp, onClose }) {
  const [amount, setAmount] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const otherCurrency = currency === "CLP" ? "USD" : "CLP";

  async function submit(event) {
    event.preventDefault();
    if (amount === null || pending) return;
    setPending(true);
    setError("");
    try {
      await topUp(amount);
      onClose();
    } catch (failure) {
      setError(failure.message);
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
          <fieldset className="wallet-options" disabled={pending}>
            <legend>Montos de recarga</legend>
            {amounts.map((option) => (
              <label className="wallet-option" key={option}>
                <input type="radio" name="top-up-amount" value={option} checked={amount === option}
                  onChange={() => setAmount(option)} />
                <span>
                  <strong>{formatted(option, currency)}</strong>
                  <small>Equivale a {formatted(option, otherCurrency)}</small>
                </span>
              </label>
            ))}
          </fieldset>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button className="button" disabled={amount === null || pending}>
            {pending ? "Recargando…" : "Añadir saldo virtual"}
          </button>
        </form>
      </section>
    </Modal>
  );
}
