import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useMarket } from "./context/MarketContext";
import Layout from "./components/Layout";
import Catalogue from "./pages/Catalogue";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Inventory from "./pages/Inventory";
import Admin from "./pages/Admin";
function Protected({ children, admin = false }) {
  const { user } = useMarket();
  if (!user) return <Navigate to="/acceso" replace />;
  if (admin && user.role !== "admin")
    return (
      <div className="empty-state">
        <h1>Acceso restringido</h1>
        <p>Esta sección es exclusiva para administradores.</p>
        <Link className="button" to="/productos">
          Volver al mercado
        </Link>
      </div>
    );
  return children;
}
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Catalogue home />} />
        <Route path="/productos" element={<Catalogue />} />
        <Route path="/acceso" element={<Auth />} />
        <Route path="/login" element={<Navigate to="/acceso" replace />} />
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
