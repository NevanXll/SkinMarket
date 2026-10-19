import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { useMarket } from "../context/MarketContext";
import { imageUrl, money, validateProduct } from "../lib/market";
import catalog from "../data/catalog.json";
import Modal from "../components/Modal";
import AdminOverview from "../components/AdminOverview";
import AdminUsers from "../components/AdminUsers";
import "../admin.css";
const blank = {
  name: "",
  category: "Rifles",
  rarity: "Covert",
  color: "#eb4b4b",
  price: "",
  stock: "",
  image: catalog[0].image,
  collection: "Colección personalizada",
  wear: "Factory New",
  featured: false,
};
export default function Admin() {
  const [tab, setTab] = useState("overview");
  const { state, saveProduct, deleteProduct, resetDemo, notify } = useMarket();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirmation, setConfirmation] = useState(null);
  const products = state.products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );
  function edit(p) {
    setEditing({ ...p });
    setErrors({});
  }
  function field(key, label, type = "text") {
    return (
      <label>
        {label}
        <input
          aria-label={label}
          type={type}
          min={type === "number" ? "0" : undefined}
          step={key === "price" ? "0.01" : key === "stock" ? "1" : undefined}
          value={editing[key]}
          onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
          aria-invalid={!!errors[key]}
        />
        {errors[key] && <span className="field-error">{errors[key]}</span>}
      </label>
    );
  }
  return (
    <div className="page-container">
      <div className="page-heading admin-heading">
        <div>
          <span className="eyebrow">CONTROL DEL MERCADO</span>
          <h1>
            Administración<span>.</span>
          </h1>
          <p>Ventas, catálogo y usuarios. Todo tu mercado en un solo lugar.</p>
        </div>
        <button
          className="button"
          onClick={() => {
            setTab("products");
            edit(blank);
          }}
        >
          <Plus size={17} />
          Nuevo producto
        </button>
      </div>
      <nav className="admin-tabs" aria-label="Secciones de administración">
        {[
          ["overview", "Resumen"],
          ["products", "Productos"],
          ["users", "Usuarios"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            aria-current={tab === key ? "page" : undefined}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "overview" && <AdminOverview />}
      {tab === "users" && <AdminUsers />}
      {tab === "products" && (
        <>
          <div className="account-stats">
            <div>
              <span>PRODUCTOS</span>
              <strong>{state.products.length}</strong>
            </div>
            <div>
              <span>UNIDADES EN STOCK</span>
              <strong>{state.products.reduce((s, p) => s + p.stock, 0)}</strong>
            </div>
            <div>
              <span>SIN STOCK</span>
              <strong>{state.products.filter((p) => !p.stock).length}</strong>
            </div>
          </div>
          <div className="admin-toolbar">
            <label className="search-box">
              <Search size={16} />
              <input
                placeholder="Buscar producto…"
                aria-label="Buscar producto administrativo"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button
              className="text-button"
              onClick={() => setConfirmation({ reset: true })}
            >
              Restaurar demostración
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio · {state.currency}</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-product">
                        <img src={imageUrl(p.image)} alt="" />
                        <span>
                          {p.name}
                          <small>{p.rarity}</small>
                        </span>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>{money(p.price, state.currency)}</td>
                    <td>
                      <span className={p.stock ? "stock-badge" : "out-badge"}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          aria-label={`Editar ${p.name}`}
                          onClick={() => edit(p)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button danger"
                          aria-label={`Eliminar ${p.name}`}
                          onClick={() => setConfirmation(p)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!products.length && (
              <p className="empty-state">No hay productos para mostrar.</p>
            )}
          </div>
        </>
      )}
      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <section
            className="market-modal admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
          >
            <button
              className="icon-button modal-close"
              aria-label="Cerrar editor"
              onClick={() => setEditing(null)}
            >
              <X />
            </button>
            <span className="eyebrow">CATÁLOGO CS2</span>
            <h2 id="product-form-title">
              {editing.id ? "Editar producto" : "Nuevo producto"}
            </h2>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                const errors = validateProduct(editing);
                setErrors(errors);
                if (Object.keys(errors).length) return;
                try {
                  saveProduct(editing);
                  setEditing(null);
                } catch (e) {
                  notify(e.message, "error");
                }
              }}
            >
              {field("name", "Nombre (arma | acabado)")}
              <div className="form-row">
                {field("price", "Precio base en USD", "number")}
                {field("stock", "Stock", "number")}
              </div>
              <div className="form-row">
                <label>
                  Categoría
                  <select
                    value={editing.category}
                    onChange={(e) =>
                      setEditing({ ...editing, category: e.target.value })
                    }
                  >
                    {[
                      "Rifles",
                      "Pistolas",
                      "Cuchillos",
                      "Subfusiles",
                      "Pesadas",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Rareza
                  <select
                    value={editing.rarity}
                    onChange={(e) => {
                      const colors = {
                        "Consumer Grade": "#b0c3d9",
                        "Industrial Grade": "#5e98d9",
                        "Mil-Spec Grade": "#4b69ff",
                        Restricted: "#8847ff",
                        Classified: "#d32ce6",
                        Covert: "#eb4b4b",
                        Contraband: "#e4ae39",
                      };
                      setEditing({
                        ...editing,
                        rarity: e.target.value,
                        color: colors[e.target.value],
                      });
                    }}
                  >
                    {[
                      "Consumer Grade",
                      "Industrial Grade",
                      "Mil-Spec Grade",
                      "Restricted",
                      "Classified",
                      "Covert",
                      "Contraband",
                    ].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
              </div>
              {field("collection", "Colección")}
              <label>
                Exterior
                <select
                  value={editing.wear}
                  onChange={(e) =>
                    setEditing({ ...editing, wear: e.target.value })
                  }
                >
                  {[
                    "Factory New",
                    "Minimal Wear",
                    "Field-Tested",
                    "Well-Worn",
                    "Battle-Scarred",
                  ].map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </label>
              <label>
                Usar imagen del catálogo
                <select
                  aria-label="Imagen del catálogo"
                  value={
                    catalog.some((p) => p.image === editing.image)
                      ? editing.image
                      : ""
                  }
                  onChange={(e) =>
                    setEditing({ ...editing, image: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Imagen personalizada
                  </option>
                  {catalog.map((p) => (
                    <option key={p.id} value={p.image}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              {field("image", "Ruta o URL HTTPS de imagen")}
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) =>
                    setEditing({ ...editing, featured: e.target.checked })
                  }
                />
                Mostrar en destacadas
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>
                <button className="button">Guardar producto</button>
              </div>
            </form>
          </section>
        </Modal>
      )}
      {confirmation && (
        <Modal onClose={() => setConfirmation(null)}>
          <section
            className="market-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <h2 id="confirm-title">
              {confirmation.reset
                ? "¿Restaurar demostración?"
                : "¿Eliminar producto?"}
            </h2>
            <p>
              {confirmation.reset
                ? "Se borrarán las cuentas, compras y cambios locales de esta versión. Se restaurarán las cuentas de prueba."
                : `Se eliminará ${confirmation.name} del catálogo y los carritos. Las compras anteriores se conservarán.`}
            </p>
            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setConfirmation(null)}
              >
                Cancelar
              </button>
              <button
                className="button danger-button"
                onClick={() => {
                  if (confirmation.reset) resetDemo();
                  else deleteProduct(confirmation.id);
                  setConfirmation(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </section>
        </Modal>
      )}
    </div>
  );
}
