import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useMarket } from "../context/MarketContext";
import { cartLines, imageUrl, money } from "../lib/market";
export default function Cart() {
  const { state, user, changeQuantity, buy, notify } = useMarket();
  const navigate = useNavigate();
  const lines = cartLines(state, user);
  const total = lines.reduce(
    (s, l) => s + (l.product?.price || 0) * l.quantity,
    0,
  );
  const shortage = lines.some(
    (l) => !l.product || l.quantity > l.product.stock,
  );
  function change(id, q) {
    try {
      changeQuantity(id, q);
    } catch (e) {
      notify(e.message, "error");
    }
  }
  return (
    <div className="page-container">
      <div className="page-heading">
        <span className="eyebrow">TU PRÓXIMA JUGADA</span>
        <h1>
          Carrito de compras<span>.</span>
        </h1>
        <p>Un paso más cerca de tu nuevo loadout.</p>
      </div>
      {!lines.length ? (
        <div className="empty-state">
          <ShoppingCart size={44} />
          <h2>Tu carrito está esperando</h2>
          <p>Encuentra esa skin que hace la diferencia.</p>
          <Link className="button" to="/productos">
            Explorar mercado <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items">
            {lines.map((l) => (
              <article className="cart-item" key={l.productId}>
                {l.product && (
                  <img src={imageUrl(l.product.image)} alt={l.product.name} />
                )}
                <div>
                  <h3>{l.product?.name || "Producto eliminado"}</h3>
                  <p className="muted">
                    {l.product?.wear} · {l.product?.stock || 0} en stock
                  </p>
                  <strong>
                    {money(l.product?.price || 0, state.currency)}
                  </strong>
                </div>
                <div className="quantity-control">
                  <button
                    aria-label={`Reducir ${l.product?.name}`}
                    onClick={() => change(l.productId, l.quantity - 1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{l.quantity}</span>
                  <button
                    aria-label={`Aumentar ${l.product?.name}`}
                    disabled={l.quantity >= (l.product?.stock || 0)}
                    onClick={() => change(l.productId, l.quantity + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  className="icon-button danger"
                  aria-label={`Quitar ${l.product?.name}`}
                  onClick={() => change(l.productId, 0)}
                >
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
            <Link className="text-link" to="/productos">
              ← Seguir explorando
            </Link>
          </section>
          <aside className="order-summary">
            <span className="eyebrow">EL ÚLTIMO PASO</span>
            <h2>Resumen de compra</h2>
            <p>
              <span>Artículos</span>
              <strong>{lines.reduce((s, l) => s + l.quantity, 0)}</strong>
            </p>
            <p>
              <span>Subtotal</span>
              <strong>{money(total, state.currency)}</strong>
            </p>
            <p>
              <span>Comisiones</span>
              <span>Sin comisión</span>
            </p>
            <p className="order-total">
              <span>Total</span>
              <strong>{money(total, state.currency)}</strong>
            </p>
            <p>
              <span>Tu saldo virtual</span>
              <strong>{money(user.balance, state.currency)}</strong>
            </p>
            {total > user.balance && (
              <p className="field-error" role="alert">
                Saldo insuficiente. Recarga desde la billetera superior.
              </p>
            )}
            {shortage && (
              <p className="field-error" role="alert">
                Stock insuficiente. Reduce o elimina los artículos señalados.
              </p>
            )}
            <button
              className="button full-width"
              disabled={total > user.balance || shortage}
              onClick={() => {
                try {
                  buy();
                  navigate("/inventario");
                } catch (e) {
                  notify(e.message, "error");
                }
              }}
            >
              Confirmar compra <ArrowRight size={16} />
            </button>
            <small>
              <ShieldCheck size={14} />
              Compra simulada. No se realiza ningún pago real.
            </small>
          </aside>
        </div>
      )}
    </div>
  );
}
