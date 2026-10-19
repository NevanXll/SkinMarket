import { Link, NavLink } from "react-router-dom";
import {
  ShoppingCart,
  Wallet,
  Plus,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { useMarket } from "../context/MarketContext";
import { money, USD_TO_CLP } from "../lib/market";
import Modal from "./Modal";
export default function Layout({ children }) {
  const { state, user, notice, storageError, setCurrency, logout, topUp } =
    useMarket();
  const [menu, setMenu] = useState(false);
  const [wallet, setWallet] = useState(false);
  const [amount, setAmount] = useState("1000");
  const [error, setError] = useState("");
  return (
    <>
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="SkinMarket Pro, inicio">
          <span className="brand-symbol">S</span>
          <span>
            SKINMARKET <b>PRO</b>
          </span>
        </Link>
        <button
          className="icon-button mobile-menu"
          aria-label={menu ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
        <nav
          aria-label="Navegación principal"
          className={menu ? "main-nav open" : "main-nav"}
          onClick={() => setMenu(false)}
        >
          <NavLink to="/" end>
            Inicio
          </NavLink>
          <NavLink to="/productos">Mercado</NavLink>
          <NavLink to="/inventario">Inventario</NavLink>
          <NavLink to="/compras">Mis compras</NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin">Administración</NavLink>
          )}
          {user && (
            <button
              className="mobile-logout text-button"
              aria-label="Cerrar sesión desde menú"
              onClick={logout}
            >
              Cerrar sesión
            </button>
          )}
        </nav>
        <div className="header-actions">
          <select
            className="currency-select"
            aria-label="Moneda"
            value={state.currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option>USD</option>
            <option>CLP</option>
          </select>
          {user && (
            <button
              className="wallet-button"
              aria-label="Recargar saldo virtual"
              onClick={() => {
                setWallet(true);
                setError("");
              }}
            >
              <Wallet size={16} />
              <strong>{money(user.balance, state.currency)}</strong>
              <span>
                <Plus size={17} />
              </span>
            </button>
          )}
          <NavLink
            to="/carrito"
            className="cart-link"
            aria-label={`Carrito, ${user?.cart.reduce((n, l) => n + l.quantity, 0) || 0} artículos`}
          >
            <ShoppingCart size={23} />
            <b>{user?.cart.reduce((n, l) => n + l.quantity, 0) || 0}</b>
          </NavLink>
          {user ? (
            <div className="profile">
              <span className="avatar">{user.name[0]}</span>
              <span>
                {user.name}
                <small>
                  {user.role === "admin" ? "Administrador" : "Jugador CS2"}
                </small>
              </span>
              <button
                className="icon-button"
                aria-label="Cerrar sesión"
                onClick={logout}
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <Link className="button button-small" to="/acceso">
              Acceder <ArrowUpRight size={14} />
            </Link>
          )}
        </div>
      </header>
      {storageError && (
        <p className="storage-warning" role="alert">
          El navegador no permite guardar los cambios. Se perderán al cerrar
          esta página.
        </p>
      )}
      <main id="contenido">{children}</main>
      <footer className="site-footer">
        <Link className="brand" to="/">
          <span className="brand-symbol">S</span> SKINMARKET <b>PRO</b>
        </Link>
        <p>
          Tu próximo loadout empieza aquí.
          <br />
          <small>
            Proyecto académico · Compras y saldo simulados · Sin afiliación con
            Valve.
          </small>
        </p>
        <span>
          <ShieldCheck size={16} /> Experiencia de demostración
        </span>
        <a
          href="https://github.com/ByMykel/CSGO-API"
          target="_blank"
          rel="noreferrer"
        >
          Datos: ByMykel/CSGO-API ↗
        </a>
      </footer>
      {notice && (
        <div className={`market-toast ${notice.type}`} role="status">
          {notice.text}
        </div>
      )}
      {wallet && (
        <Modal onClose={() => setWallet(false)}>
          <section
            className="market-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-title"
            onKeyDown={(e) => {
              if (e.key === "Escape") setWallet(false);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="icon-button modal-close"
              aria-label="Cerrar recarga"
              onClick={() => setWallet(false)}
            >
              <X />
            </button>
            <span className="eyebrow">BILLETERA DE PRUEBA</span>
            <h2 id="wallet-title">Más saldo. Más posibilidades.</h2>
            <p>
              Recarga virtual, sin pagos reales. 1 USD = {USD_TO_CLP} CLP (tasa
              de demostración).
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  topUp(
                    Number(amount) /
                      (state.currency === "CLP" ? USD_TO_CLP : 1),
                  );
                  setWallet(false);
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              <label>
                Monto en {state.currency}
                <input
                  autoFocus
                  type="number"
                  step={state.currency === "CLP" ? "1" : "0.01"}
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </label>
              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
              <button className="button">Añadir saldo virtual</button>
            </form>
          </section>
        </Modal>
      )}
    </>
  );
}
