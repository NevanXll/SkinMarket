import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useMarket } from "../context/MarketContext";
import { money } from "../lib/market";
import ProductCard from "../components/ProductCard";
import { api } from "../services/api";

export default function SellerPanel({ orderDetail = false }) {
  const { state } = useMarket();
  const { id } = useParams();
  const location = useLocation();
  const [tab, setTab] = useState(() => location.state?.tab === "orders" ? "orders" : "products");
  const [response, setResponse] = useState(null);
  const showOrders = orderDetail || tab === "orders";
  const path = orderDetail ? `/seller/orders/${encodeURIComponent(id)}` : "/seller/orders";
  const result = response?.path === path ? response.result : null;
  const error = response?.path === path ? response.error : "";
  useEffect(() => {
    if (!showOrders) return;
    let active = true;
    api(path).then((data) => { if (active) setResponse({ path, result: data }); })
      .catch((failure) => { if (active) setResponse({ path, error: failure.message }); });
    return () => { active = false; };
  }, [path, showOrders]);

  const orders = orderDetail ? (result ? [result] : []) : (Array.isArray(result) ? result : []);
  return (
    <div className="page-container">
      <div className="page-heading"><h1>{orderDetail ? "Detalle de orden" : "Panel de vendedor"}</h1></div>
      {orderDetail ? <Link to="/vendedor" state={{ tab: "orders" }}>Volver al panel</Link> : (
        <nav className="admin-tabs" aria-label="Vista de vendedor">
          <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>Productos</button>
          <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>Órdenes</button>
        </nav>
      )}
      {!showOrders ? <div className="product-grid">{state.products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : (
        <div className="orders-list">
          {error && <p role="alert">{error}</p>}
          {!result && !error && <p role="status">Cargando órdenes…</p>}
          {result && orders.length === 0 && <p className="empty-state">Todavía no hay órdenes.</p>}
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <h2>Orden #{order.id.slice(0, 8)}</h2>
              <time dateTime={order.date}>{new Date(order.date).toLocaleString("es-CL")}</time>
              {orderDetail && <ul>{order.items.map((item) => <li key={item.id}>{item.quantity} × {item.name}</li>)}</ul>}
              <p>Total: {money(order.total, state.currency)}</p>
              {!orderDetail && <Link to={`/vendedor/ordenes/${order.id}`}>Ver detalle</Link>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
