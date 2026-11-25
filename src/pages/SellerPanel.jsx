import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, History, Plus, Tag } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useMarket } from "../context/MarketContext";
import { dashboardStats } from "../lib/admin";
import { imageUrl, money } from "../lib/market";
import { api } from "../services/api";
import "../admin.css";

const saleDate = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" });
const tabs = [
  ["overview", "Resumen", BarChart3],
  ["listings", "Publicaciones", Tag],
  ["orders", "Historial de ventas", History],
];

function ListingInput({ label, value, onChange, ...limits }) {
  return (
    <label>
      {label}
      <input className="form-control" type="number" required value={value}
        onChange={(event) => onChange(event.target.value)} {...limits} />
    </label>
  );
}

function PublishSkin({ inventory, onPublish, pending, error, onCancel }) {
  const [selected, setSelected] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const key = (skin) => `${skin.orderId}/${skin.productId}`;
  const skin = inventory.find((item) => key(item) === selected);

  return (
    <form className="order-card seller-listing-form" onSubmit={(event) => {
      event.preventDefault();
      if (skin) onPublish({ orderId: skin.orderId, productId: skin.productId, price: Number(price), quantity: Number(quantity) });
    }}>
      <h2>Publicar una skin</h2>
      <label>
        Skin de mi inventario
        <select className="form-select" value={selected} required disabled={pending} onChange={(event) => {
          setSelected(event.target.value);
          setQuantity("1");
        }}>
          <option value="">Selecciona una skin</option>
          {inventory.map((item) => <option key={key(item)} value={key(item)}>
            {item.name} · {item.quantity} {item.quantity === 1 ? "unidad" : "unidades"} · {saleDate.format(new Date(item.acquiredAt))}
          </option>)}
        </select>
      </label>
      {skin && <div className="seller-skin-preview">
        <img src={imageUrl(skin.image)} alt="" />
        <div><strong>{skin.name}</strong><p className="muted">{skin.quantity} {skin.quantity === 1 ? "unidad disponible" : "unidades disponibles"} en esta compra</p></div>
      </div>}
      <div className="seller-listing-fields">
        <ListingInput label="Precio por unidad en USD" value={price} onChange={setPrice}
          min="0.01" max="999999999.99" step="0.01" disabled={pending} />
        <ListingInput label="Unidades en venta" value={quantity} onChange={setQuantity}
          min="1" max={skin?.quantity} step="1" disabled={pending || !skin} />
      </div>
      {error && <p role="alert" className="field-error">{error}</p>}
      <div className="seller-listing-actions">
        <button className="button" disabled={pending || !skin}>{pending ? "Publicando…" : "Publicar en el mercado"}</button>
        <button type="button" className="button secondary" disabled={pending} onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}

function ListingCard({ listing, currency, onSave }) {
  const [price, setPrice] = useState(String(listing.price));
  const [quantity, setQuantity] = useState(String(listing.stock));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const editable = !listing.removed && listing.available > 0;
  const status = listing.removed ? "Retirada" : listing.stock > 0 ? "En venta" : editable ? "Pausada" : "Vendida";

  async function save(stock) {
    setPending(true);
    setError("");
    try {
      const updated = await onSave(listing.id, { price: Number(stock === 0 ? listing.price : price), quantity: stock });
      setPrice(String(updated.price));
      setQuantity(String(updated.stock));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="order-card seller-listing-form">
      <div className="seller-skin-preview">
        <img src={imageUrl(listing.image)} alt="" />
        <div>
          <h3>{listing.name}</h3>
          <p className="muted">{status} · {money(listing.price, currency)} · {listing.sold} vendidas</p>
        </div>
      </div>
      {editable && <form onSubmit={(event) => { event.preventDefault(); save(Number(quantity)); }}>
        <div className="seller-listing-fields">
          <ListingInput label="Precio por unidad en USD" value={price} onChange={setPrice}
            min="0.01" max="999999999.99" step="0.01" disabled={pending} />
          <ListingInput label="Unidades en venta" value={quantity} onChange={setQuantity}
            min="1" max={listing.available} step="1" disabled={pending} />
        </div>
        <p className="muted">Hasta {listing.available} {listing.available === 1 ? "unidad" : "unidades"}</p>
        <div className="seller-listing-actions">
          <button className="button secondary" disabled={pending}>{listing.stock ? "Guardar cambios" : "Reactivar publicación"}</button>
          {!!listing.stock && <button type="button" className="text-button" onClick={() => save(0)} disabled={pending}>Pausar</button>}
        </div>
      </form>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </article>
  );
}

function SalesHistory({ orders, currency, detail = false }) {
  if (!orders.length) return <p className="empty-state">Aún no tienes ventas registradas.</p>;

  return (
    <div className="orders-list">
      {orders.map((order) => (
        <article className="order-card" key={order.id}>
          <h2>Venta #{order.id.slice(0, 8)}</h2>
          <time dateTime={order.date}>{saleDate.format(new Date(order.date))}</time>
          {detail && <ul className="seller-sale-lines">
            {order.items.map((item) => <li key={item.id}><span>{item.quantity} × {item.name}</span><strong>{money(item.price * item.quantity, currency)}</strong></li>)}
          </ul>}
          <p>Total de tus productos: <strong>{money(order.total, currency)}</strong></p>
          {!detail && <Link to={`/vendedor/ordenes/${order.id}`}>Ver detalle</Link>}
        </article>
      ))}
    </div>
  );
}

function SellerOverview({ listings, orders, currency, onOpen }) {
  const stats = dashboardStats({ products: [], users: [{ orders }] });
  const active = listings.filter((listing) => !listing.removed && listing.stock > 0).length;
  const max = Math.max(1, ...stats.days.map((day) => day.total));
  return (
    <>
      <div className="account-stats seller-metrics">
        <div><span>VENTAS SIMULADAS</span><strong>{money(stats.revenue, currency)}</strong></div>
        <div><span>PEDIDOS CON TUS SKINS</span><strong>{orders.length}</strong></div>
        <div><span>UNIDADES VENDIDAS</span><strong>{stats.units}</strong></div>
        <div><span>PUBLICACIONES ACTIVAS</span><strong>{active}</strong></div>
      </div>
      <figure className="chart-card seller-sales-chart">
        <figcaption><h2>Mis ventas de los últimos 7 días</h2><span className="chart-chip">{currency}</span></figcaption>
        <div className="sales-columns">
          {stats.days.map((day) => (
            <div className="sales-column" key={day.key}>
              <span className="sales-value">{money(day.total, currency)}</span>
              <div className="sales-track"><div className="sales-fill" style={{ height: `${(day.total / max) * 100}%` }} /></div>
              <span className="day-label">{day.label}</span>
            </div>
          ))}
        </div>
      </figure>
      <div className="seller-section-heading">
        <h2>Ventas recientes</h2>
        {!!orders.length && <button className="text-button" onClick={() => onOpen("orders")}>Ver historial</button>}
      </div>
      <SalesHistory orders={orders.slice(0, 3)} currency={currency} />
    </>
  );
}

export default function SellerPanel({ orderDetail = false }) {
  const { state, notify } = useMarket();
  const { id } = useParams();
  const location = useLocation();
  const [tab, setTab] = useState(() => location.state?.tab === "orders" ? "orders" : "overview");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [pending, setPending] = useState(false);
  const [publishError, setPublishError] = useState("");
  const path = orderDetail ? `/seller/orders/${encodeURIComponent(id)}` : "/seller/orders";

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    setData(null);
    setError("");
    const request = orderDetail
      ? api(path, options).then((sale) => ({ orders: [sale] }))
      : Promise.all([api("/seller/listings", options), api(path, options)]).then(([market, orders]) => ({ ...market, orders }));
    request.then(setData).catch((failure) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, [path, orderDetail]);

  async function publish(input) {
    setPending(true);
    setPublishError("");
    try {
      const listing = await api("/seller/listings", { method: "POST", body: input });
      setData((previous) => ({
        ...previous, listings: [listing, ...previous.listings],
        inventory: previous.inventory.filter((skin) => skin.orderId !== input.orderId || skin.productId !== input.productId),
      }));
      setPublishing(false);
      notify("Skin publicada en el mercado.");
    } catch (failure) {
      setPublishError(failure.message);
    } finally {
      setPending(false);
    }
  }

  async function save(id, input) {
    const listing = await api(`/seller/listings/${encodeURIComponent(id)}`, { method: "PUT", body: input });
    setData((previous) => ({ ...previous, listings: previous.listings.map((item) => item.id === listing.id ? listing : item) }));
    notify(input.quantity ? "Publicación guardada." : "Publicación pausada.");
    return listing;
  }

  return (
    <div className="page-container seller-panel">
      <div className="page-heading">
        <h1>{orderDetail ? "Detalle de venta" : "Panel de vendedor"}</h1>
        {!orderDetail && <p>Gestiona las skins de tu inventario que quieres poner a la venta.</p>}
      </div>
      {orderDetail ? (
        <Link className="button secondary seller-back" to="/vendedor" state={{ tab: "orders" }}><ArrowLeft size={16} /> Volver al historial</Link>
      ) : (
        <nav className="admin-tabs" aria-label="Panel de vendedor">
          {tabs.map(([key, label, Icon]) => (
            <button key={key} className={tab === key ? "active" : ""} aria-current={tab === key ? "page" : undefined}
              onClick={() => setTab(key)}><Icon size={15} /> {label}</button>
          ))}
        </nav>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
      {!data && !error && <p role="status">Cargando…</p>}
      {data && (orderDetail || tab === "orders") && <SalesHistory orders={data.orders} currency={state.currency} detail={orderDetail} />}
      {data && !orderDetail && tab === "overview" && <SellerOverview {...data} currency={state.currency} onOpen={setTab} />}
      {data && !orderDetail && tab === "listings" && (
        <section aria-labelledby="seller-listings-title">
          <div className="seller-section-heading">
            <h2 id="seller-listings-title">Mis publicaciones</h2>
            {!publishing && <button className="button" onClick={() => { setPublishing(true); setPublishError(""); }} disabled={!data.inventory.length}>
              <Plus size={16} /> Publicar skin
            </button>}
          </div>
          {!data.inventory.length && <p className="muted">No tienes skins sin publicar en tu inventario.</p>}
          {publishing && <PublishSkin inventory={data.inventory} pending={pending} error={publishError} onPublish={publish}
            onCancel={() => setPublishing(false)} />}
          {!data.listings.length && !publishing && <p className="empty-state">Todavía no tienes publicaciones.</p>}
          <div className="seller-listings-grid">
            {data.listings.map((listing) => <ListingCard key={listing.id} listing={listing} currency={state.currency} onSave={save} />)}
          </div>
        </section>
      )}
    </div>
  );
}
