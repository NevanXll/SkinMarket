import { Link } from "react-router-dom";
import { Package, Receipt, ArrowRight } from "lucide-react";
import { useMarket } from "../context/MarketContext";
import { imageUrl, money } from "../lib/market";
export default function Inventory({ orders = false }) {
  const { user, state } = useMarket();
  const items = orders ? user.orders : user.inventory;
  return (
    <div className="page-container">
      <div className="page-heading">
        <span className="eyebrow">TU ESPACIO PERSONAL</span>
        <h1>
          {orders ? "Mis compras" : "Mi inventario"}
          <span>.</span>
        </h1>
        <p>
          {orders
            ? "Cada compra, cada nueva adquisición."
            : "Tu colección. Tu identidad dentro del juego."}
        </p>
      </div>
      <div className="account-stats">
        <div>
          <span>SKINS ADQUIRIDAS</span>
          <strong>{user.inventory.reduce((s, p) => s + p.quantity, 0)}</strong>
        </div>
        <div>
          <span>COMPRAS REALIZADAS</span>
          <strong>{user.orders.length}</strong>
        </div>
        <div>
          <span>SALDO VIRTUAL · {state.currency}</span>
          <strong>{money(user.balance, state.currency)}</strong>
        </div>
      </div>
      {!items.length ? (
        <div className="empty-state">
          {orders ? <Receipt size={40} /> : <Package size={40} />}
          <h2>
            {orders
              ? "Aún no tienes compras"
              : "Tu colección comienza con una skin"}
          </h2>
          <p>Las skins que compres aparecerán aquí.</p>
          <Link className="button" to="/productos">
            Explorar mercado <ArrowRight size={16} />
          </Link>
        </div>
      ) : orders ? (
        <div className="orders-list">
          {items.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="section-heading">
                <h3>Compra #{order.id.slice(0, 8)}</h3>
                <span className="success-badge">Completada</span>
              </div>
              <time>{new Date(order.date).toLocaleString("es-CL")}</time>
              <ul>
                {order.items.map((p) => (
                  <li key={p.id}>
                    {p.quantity} × {p.name}
                    <strong>
                      {money(p.price * p.quantity, state.currency)}
                    </strong>
                  </li>
                ))}
              </ul>
              <p className="order-total">
                Total <strong>{money(order.total, state.currency)}</strong>
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="product-grid inventory-grid">
          {items.map((p) => (
            <article
              className="product-card"
              key={`${p.orderId}-${p.id}`}
              style={{ "--rarity": p.color }}
            >
              <div className="product-art">
                <img src={imageUrl(p.image)} alt={p.name} />
              </div>
              <div className="product-info">
                <span className="weapon-name">{p.weapon}</span>
                <h3>{p.finish}</h3>
                <p className="rarity">
                  <i />
                  {p.rarity}
                </p>
                <p className="muted">
                  {p.quantity} {p.quantity === 1 ? "unidad" : "unidades"} ·{" "}
                  {new Date(p.acquiredAt).toLocaleDateString("es-CL")}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
