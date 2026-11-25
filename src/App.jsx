import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useMarket } from "./context/MarketContext";
import Layout from "./components/Layout";
import Catalogue from "./pages/Catalogue";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Inventory from "./pages/Inventory";
import Admin from "./pages/Admin";
import ProductDetail from "./pages/ProductDetail";
import SellerApplication from "./pages/SellerApplication";
import SellerPanel from "./pages/SellerPanel";
import Profile from "./pages/Profile";
function Protected({ children, admin = false, allowed = ["client", "admin", "seller"] }) {
  const { user, loading } = useMarket();
  if (loading) return <p role="status">Restaurando sesión…</p>;
  if (!user) return <Navigate to="/acceso" replace />;
  if (!(admin ? user.role === "admin" : allowed.includes(user.role)))
    return (
      <div className="empty-state">
        <h1>Acceso restringido</h1>
        <p>{admin ? "Esta sección es exclusiva para administradores." : "Tu cuenta no tiene acceso a esta sección."}</p>
        <Link className="button" to={user.role === "seller" ? "/vendedor" : "/productos"}>
          {user.role === "seller" ? "Volver al panel" : "Volver al mercado"}
        </Link>
      </div>
    );
  return children;
}
export default function App() {
  const { pathname } = useLocation();
  const { user } = useMarket();
  const seller = user?.role === "seller";
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Catalogue home />} />
        <Route path="/productos" element={<Catalogue />} />
        <Route path="/productos/:id" element={<ProductDetail />} />
        <Route path="/acceso" element={seller ? <Navigate to="/vendedor" replace /> : <Auth />} />
        <Route path="/vender" element={
          <Protected allowed={["client", "seller"]}><SellerApplication /></Protected>
        } />
        <Route path="/vendedor" element={
          <Protected allowed={["seller"]}><SellerPanel /></Protected>
        } />
        <Route path="/vendedor/ordenes/:id" element={
          <Protected allowed={["seller"]}><SellerPanel orderDetail /></Protected>
        } />
        <Route path="/login" element={<Navigate to="/acceso" replace />} />
        <Route path="/perfil" element={
          <Protected allowed={["client", "admin", "seller"]}><Profile key={user?.id} /></Protected>
        } />
        <Route
          path="/carrito"
          element={
            <Protected>
              <Cart />
            </Protected>
          }
        />
        <Route
          path="/inventario"
          element={
            <Protected>
              <Inventory />
            </Protected>
          }
        />
        <Route
          path="/compras"
          element={
            <Protected>
              <Inventory orders />
            </Protected>
          }
        />
        <Route
          path="/admin"
          element={
            <Protected admin>
              <Admin />
            </Protected>
          }
        />
        <Route
          path="*"
          element={
            <div className="empty-state">
              <h1>404 · Fuera del mapa</h1>
              <p>Esta página no existe.</p>
              <Link className="button" to="/">
                Volver al inicio
              </Link>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}
