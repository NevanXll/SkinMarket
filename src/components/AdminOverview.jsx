import {
  TrendingUp,
  ShoppingBag,
  Users,
  PackageCheck,
  ArrowUpRight,
} from "lucide-react";
import { useMarket } from "../context/MarketContext";
import { dashboardStats } from "../lib/admin";
import { money } from "../lib/market";

export default function AdminOverview() {
  const { state } = useMarket();
  const stats = dashboardStats(state);
  const format = (value) => money(value, state.currency);
  const maxSales = Math.max(...stats.days.map((day) => day.total), 1);
  const maxStock = Math.max(...stats.stock.map((item) => item.quantity), 1);
  const maxSold = Math.max(
    ...stats.bestSellers.map((item) => item.quantity),
    1,
  );
  return (
    <section
      aria-label="Resumen estadístico del mercado"
      className="dashboard-overview"
    >
      <div className="dashboard-kpis">
        <article>
          <span className="kpi-icon">
            <TrendingUp size={20} />
          </span>
          <span>VENTAS SIMULADAS · {state.currency}</span>
          <strong>{format(stats.revenue)}</strong>
          <small>Acumulado de todas las cuentas locales</small>
        </article>
        <article>
          <span className="kpi-icon">
            <ShoppingBag size={20} />
          </span>
          <span>COMPRAS COMPLETADAS</span>
          <strong>{stats.orders}</strong>
          <small>Ticket promedio: {format(stats.average)}</small>
        </article>
        <article>
          <span className="kpi-icon">
            <PackageCheck size={20} />
          </span>
          <span>SKINS VENDIDAS</span>
          <strong>{stats.units}</strong>
          <small>Unidades adquiridas por los usuarios</small>
        </article>
        <article>
          <span className="kpi-icon">
            <Users size={20} />
          </span>
          <span>USUARIOS REGISTRADOS</span>
          <strong>{stats.users}</strong>
          <small>
            {stats.blocked}{" "}
            {stats.blocked === 1 ? "cuenta bloqueada" : "cuentas bloqueadas"}
          </small>
        </article>
      </div>
      <div className="dashboard-charts">
        <figure className="chart-card sales-chart">
          <figcaption>
            <div>
              <span className="eyebrow">ACTIVIDAD DEL MERCADO</span>
              <h2>Ventas de los últimos 7 días</h2>
            </div>
            <span className="chart-chip">{state.currency}</span>
          </figcaption>
          <p className="chart-description">
            Importe de las compras completadas por día.
          </p>
          <div className="sales-columns">
            {stats.days.map((day) => (
              <div className="sales-column" key={day.key}>
                <span className="sales-value">{format(day.total)}</span>
                <div className="sales-track">
                  <div
                    className="sales-fill"
                    style={{ height: `${(day.total / maxSales) * 100}%` }}
                  />
                </div>
                <span className="day-label">{day.label}</span>
                <small>{day.orders} compras</small>
              </div>
            ))}
          </div>
          {!stats.days.some((day) => day.orders) && (
            <p className="chart-note">
              Aún no hay ventas en este período. Las compras nuevas aparecerán
              aquí.
            </p>
          )}
        </figure>
        <figure className="chart-card">
          <figcaption>
            <div>
              <span className="eyebrow">DISPONIBILIDAD</span>
              <h2>Stock por categoría</h2>
            </div>
            <PackageCheck size={20} />
          </figcaption>
          <p className="chart-description">
            Unidades disponibles en el catálogo actual.
          </p>
          <ul className="horizontal-bars">
            {stats.stock.map((item) => (
              <li key={item.name}>
                <div>
                  <span>{item.name}</span>
                  <strong>{item.quantity} unidades</strong>
                </div>
                <div className="bar-track" aria-hidden="true">
                  <span
                    style={{ width: `${(item.quantity / maxStock) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          {!stats.stock.length && (
            <p className="chart-note">No hay productos en el catálogo.</p>
          )}
        </figure>
        <figure className="chart-card">
          <figcaption>
            <div>
              <span className="eyebrow">LAS FAVORITAS</span>
              <h2>Top 5 skins más vendidas</h2>
            </div>
            <TrendingUp size={20} />
          </figcaption>
          <p className="chart-description">
            Clasificación por unidades vendidas, de todo el historial.
          </p>
          {stats.bestSellers.length ? (
            <ol className="horizontal-bars sellers">
              {stats.bestSellers.map((item, index) => (
                <li key={item.id}>
                  <div>
                    <span>
                      <b>{String(index + 1).padStart(2, "0")}</b>
                      {item.name}
                    </span>
                    <strong>
                      {item.quantity}{" "}
                      {item.quantity === 1 ? "unidad" : "unidades"}
                    </strong>
                  </div>
                  <div className="bar-track" aria-hidden="true">
                    <span
                      style={{ width: `${(item.quantity / maxSold) * 100}%` }}
                    />
                  </div>
                  <small>{format(item.revenue)} en ventas</small>
                </li>
              ))}
            </ol>
          ) : (
            <div className="chart-empty">
              <ShoppingBag size={30} />
              <h3>Las próximas favoritas se deciden jugando</h3>
              <p>
                Realiza una compra con una cuenta de cliente para ver las skins
                más vendidas.
              </p>
            </div>
          )}
        </figure>
        <section
          className="chart-card recent-orders"
          aria-label="Compras recientes"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">EN TIEMPO REAL LOCAL</span>
              <h2>Últimas compras</h2>
            </div>
            <ArrowUpRight size={20} />
          </div>
          {stats.recent.length ? (
            <ul>
              {stats.recent.map((order) => (
                <li key={order.id}>
                  <span className="order-avatar">{order.customer[0]}</span>
                  <div>
                    <strong>{order.customer}</strong>
                    <time>{new Date(order.date).toLocaleString("es-CL")}</time>
                  </div>
                  <strong>{format(order.total)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="chart-note">Aún no se han registrado compras.</p>
          )}
          <p className="dashboard-scope">
            Datos reales de la simulación de este navegador. Las recargas de
            saldo no se cuentan como ingresos.
          </p>
        </section>
      </div>
    </section>
  );
}
