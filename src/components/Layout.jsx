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
import { money } from "../lib/market";
import WalletTopUp from "./WalletTopUp";
import ProfileAvatar from "./ProfileAvatar";
export default function Layout({ children }) {
  const { state, user, notice, serviceError, loading, retry, setCurrency, logout, topUp } =
    useMarket();
  const [menu, setMenu] = useState(false);
  const [wallet, setWallet] = useState(false);
  const seller = user?.role === "seller";
  return (
    <>
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>
      <header className="site-header">
        <Link className="brand" to={seller ? "/vendedor" : "/"} aria-label="SkinMarket Pro, inicio">
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
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/productos">Mercado</NavLink>
          <NavLink to="/inventario">Inventario</NavLink>
          <NavLink to="/compras">Mis compras</NavLink>
          {seller && <NavLink to="/vendedor">Panel de vendedor</NavLink>}
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
              onClick={() => setWallet(true)}
            >
              <Wallet size={16} />
              {user.showHeaderBalance !== false && <strong>{money(user.balance, state.currency)}</strong>}
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
              <NavLink to="/perfil" className="profile-link" aria-label="Mi perfil">
                <ProfileAvatar name={user.showHeaderName === false ? "?" : user.name} avatar={user.avatar} photo={user.avatarPhoto} />
              </NavLink>
              {user.showHeaderName !== false && <span>
                {user.name}
                <small>
                  {{ admin: "Administrador", seller: "Vendedor", client: "Jugador CS2" }[user.role]}
                </small>
              </span>}
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
      {serviceError && (
        <p className="storage-warning" role="alert">
          {serviceError} <button onClick={retry}>Reintentar conexión</button>
        </p>
      )}
      <main id="contenido">{loading ? <p role="status" className="empty-state">Conectando con SkinMarket…</p> : children}</main>
      <footer className="site-footer">
        <Link className="brand" to="/">
          <span className="brand-symbol">S</span> SKINMARKET <b>PRO</b>
        </Link>
        <p>
          Tu próximo loadout empieza aquí.
          <br />
          <small>
            Compras y saldo simulados · Sin afiliación con
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
      {wallet && user && (
        <WalletTopUp currency={state.currency} topUp={topUp} onClose={() => setWallet(false)} />
      )}
    </>
  );
}
