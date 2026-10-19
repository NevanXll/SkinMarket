import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Search,
  SlidersHorizontal,
  Star,
  Clock3,
  Crosshair,
  Swords,
  Target,
  X,
} from "lucide-react";
import { useMarket } from "../context/MarketContext";
import { filterProducts, imageUrl, money, USD_TO_CLP } from "../lib/market";
import ProductCard from "../components/ProductCard";
const initialFilters = {
  search: "",
  category: "",
  rarities: [],
  collection: "",
  wear: "",
  min: "",
  max: "",
  sort: "featured",
};
export default function Catalogue({ home = false }) {
  const { state } = useMarket();
  const [filters, setFilters] = useState(initialFilters);
  const [open, setOpen] = useState(false);
  const [searchError, setSearchError] = useState("");
  const categories = [...new Set(state.products.map((p) => p.category))];
  const rarities = [...new Map(state.products.map((p) => [p.rarity, p.color]))];
  const collections = [...new Set(state.products.map((p) => p.collection))];
  const factor = state.currency === "CLP" ? USD_TO_CLP : 1;
  const priceError =
    (filters.min !== "" &&
      (!Number.isFinite(Number(filters.min)) || Number(filters.min) < 0)) ||
    (filters.max !== "" &&
      (!Number.isFinite(Number(filters.max)) || Number(filters.max) < 0))
      ? "Los precios deben ser mayores o iguales a cero."
      : filters.min !== "" &&
          filters.max !== "" &&
          Number(filters.min) > Number(filters.max)
        ? "El mínimo no puede superar al máximo."
        : "";
  const filtered = priceError ? [] : filterProducts(state.products, filters);
  const isFiltered =
    filters.search ||
    filters.category ||
    filters.rarities.length ||
    filters.collection ||
    filters.wear ||
    filters.min ||
    filters.max;
  const featured =
    home && !isFiltered ? filtered.filter((p) => p.featured) : filtered;
  const hero =
    state.products.find((p) => p.name === "AK-47 | Asiimov") ||
    state.products[0];
  function set(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  function search(value) {
    const clean = value.replace(/[^\p{L}\p{N}\s|★.\-]/gu, "");
    setSearchError(
      clean === value ? "" : "Se eliminaron caracteres no permitidos.",
    );
    set("search", clean);
  }
  return (
    <div className="market-shell">
      <div className="mobile-filter-bar">
        <button className="button secondary" onClick={() => setOpen(!open)}>
          <SlidersHorizontal size={16} />
          Filtros
        </button>
        <span>{state.products.length} skins de CS2</span>
      </div>
      <aside
        className={`filters-panel ${open ? "visible" : ""}`}
        aria-label="Filtros del catálogo"
      >
        <div className="filter-heading">
          <h2>Filtros</h2>
          <button
            className="text-button"
            onClick={() => {
              setFilters(initialFilters);
              setSearchError("");
            }}
          >
            Limpiar
          </button>
          <button
            className="icon-button close-filters"
            aria-label="Cerrar filtros"
            onClick={() => setOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <label className="search-box">
          <Search size={16} />
          <input
            aria-label="Buscar skin"
            placeholder="Buscar skin…"
            value={filters.search}
            onChange={(e) => search(e.target.value)}
            maxLength={80}
          />
        </label>
        {searchError && <p className="field-error">{searchError}</p>}
        <label className="filter-group">
          Tipo de arma
          <select
            value={filters.category}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">Todas las armas</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <fieldset className="filter-group">
          <legend>Rareza</legend>
          {rarities.map(([r, c]) => (
            <label className="check-label" key={r}>
              <input
                type="checkbox"
                checked={filters.rarities.includes(r)}
                onChange={(e) =>
                  set(
                    "rarities",
                    e.target.checked
                      ? [...filters.rarities, r]
                      : filters.rarities.filter((x) => x !== r),
                  )
                }
              />
              <i style={{ background: c }} />
              {r}
            </label>
          ))}
        </fieldset>
        <fieldset className="filter-group">
          <legend>Rango de precio · {state.currency}</legend>
          <div className="range-decoration">
            <i />
            <span />
            <i />
          </div>
          <div className="price-inputs">
            <input
              aria-label="Precio mínimo"
              type="number"
              min="0"
              placeholder="Mínimo"
              value={
                filters.min === ""
                  ? ""
                  : Math.round(Number(filters.min) * factor * 100) / 100
              }
              onChange={(e) =>
                set(
                  "min",
                  e.target.value === "" ? "" : Number(e.target.value) / factor,
                )
              }
            />
            <span>–</span>
            <input
              aria-label="Precio máximo"
              type="number"
              min="0"
              placeholder="Máximo"
              value={
                filters.max === ""
                  ? ""
                  : Math.round(Number(filters.max) * factor * 100) / 100
              }
              onChange={(e) =>
                set(
                  "max",
                  e.target.value === "" ? "" : Number(e.target.value) / factor,
                )
              }
            />
          </div>
          {priceError && (
            <p role="alert" className="field-error">
              {priceError}
            </p>
          )}
        </fieldset>
        <label className="filter-group">
          Colección
          <select
            value={filters.collection}
            onChange={(e) => set("collection", e.target.value)}
          >
            <option value="">Todas las colecciones</option>
            {collections.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="filter-group">
          Exterior
          <select
            value={filters.wear}
            onChange={(e) => set("wear", e.target.value)}
          >
            <option value="">Todos los exteriores</option>
            <option>Factory New</option>
            <option>Minimal Wear</option>
            <option>Field-Tested</option>
            <option>Well-Worn</option>
            <option>Battle-Scarred</option>
          </select>
        </label>
        <p className="filter-note">Los filtros se aplican al instante.</p>
        <button className="button mobile-apply" onClick={() => setOpen(false)}>
          Ver resultados <ArrowRight size={15} />
        </button>
        <div className="sidebar-bottom">
          <ShieldMark />
          <strong>Arma tu próximo loadout</strong>
          <p>Explora. Colecciona. Destaca.</p>
        </div>
      </aside>
      <div className="market-content">
        {home ? (
          <section className="hero">
            <div className="hero-glow" />
            <div className="hero-copy">
              <span className="eyebrow">
                <i /> EL MERCADO DE TU PRÓXIMO NIVEL
              </span>
              <h1>
                LAS MEJORES SKINS.
                <br />
                EN UN <em>SOLO LUGAR.</em>
              </h1>
              <p>
                Tu estilo también juega. Descubre las skins
                <br className="desktop-break" /> más icónicas de Counter-Strike
                2.
              </p>
              <Link className="button" to="/productos">
                Explorar mercado <ArrowRight size={17} />
              </Link>
              <div className="hero-footnote">
                <span>01</span>
                <i />
                <span>ELIGE TU PRÓXIMA JUGADA</span>
              </div>
            </div>
            {hero && (
              <>
                <img
                  className="hero-weapon"
                  src={imageUrl(hero.image)}
                  alt={hero.name}
                />
                <div className="hero-product">
                  <span>COLECCIÓN DESTACADA</span>
                  <strong>{hero.name}</strong>
                  <small>COUNTER-STRIKE 2 / COVERT</small>
                </div>
              </>
            )}
          </section>
        ) : (
          <div className="page-heading">
            <span className="eyebrow">COUNTER-STRIKE 2</span>
            <h1>
              Encuentra tu próxima skin<span>.</span>
            </h1>
            <p>Un nuevo look para tu próxima partida.</p>
          </div>
        )}
        <div
          className="category-strip"
          style={{ "--category-count": categories.length + 1 }}
        >
          <button
            className={!filters.category ? "selected" : ""}
            onClick={() => set("category", "")}
          >
            <Crosshair />
            <span>Todas</span>
          </button>
          {categories.map((c) => (
            <button
              className={filters.category === c ? "selected" : ""}
              key={c}
              onClick={() => set("category", c)}
            >
              <img
                src={imageUrl(
                  state.products.find((p) => p.category === c).image,
                )}
                alt=""
              />
              <span>{c}</span>
            </button>
          ))}
        </div>
        <section className="catalog-section">
          <div className="section-heading">
            <h2>
              <Star fill="currentColor" />
              {home && !isFiltered
                ? "Skins destacadas"
                : "Mercado de skins"}{" "}
              <span>{featured.length}</span>
            </h2>
            <label className="sort-control">
              Ordenar
              <select
                aria-label="Ordenar productos"
                value={filters.sort}
                onChange={(e) => set("sort", e.target.value)}
              >
                <option value="featured">Destacadas</option>
                <option value="low">Menor precio</option>
                <option value="high">Mayor precio</option>
                <option value="name">Nombre A–Z</option>
              </select>
            </label>
          </div>
          <div className="product-grid row row-cols-2 row-cols-md-3 row-cols-xl-4 row-cols-xxl-6 g-2">
            {featured.map((p) => (
              <div className="col" key={p.id}><ProductCard product={p} /></div>
            ))}
          </div>
          {!featured.length && (
            <div className="empty-state">
              <Search size={35} />
              <h3>No encontramos esas skins</h3>
              <p>Prueba con otros filtros o limpia la búsqueda.</p>
              <button
                className="button secondary"
                onClick={() => setFilters(initialFilters)}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </section>
        {home && !isFiltered && (
          <>
            <div className="promo-grid">
              <Link to="/productos" className="promo promo-purple">
                <div>
                  <span className="eyebrow">TU ESTILO, TU REGLA</span>
                  <h3>
                    Un loadout
                    <br />
                    fuera de lo común.
                  </h3>
                  <span>
                    Descubrir skins <ArrowRight size={15} />
                  </span>
                </div>
                {state.products[6] && (
                  <img src={imageUrl(state.products[6].image)} alt="" />
                )}
              </Link>
              <Link to="/inventario" className="promo promo-gold">
                <div>
                  <span className="eyebrow">TU COLECCIÓN</span>
                  <h3>
                    Las mejores piezas.
                    <br />
                    En tu inventario.
                  </h3>
                  <span>
                    Ver inventario <ArrowRight size={15} />
                  </span>
                </div>
                {state.products[3] && (
                  <img src={imageUrl(state.products[3].image)} alt="" />
                )}
              </Link>
              <Link to="/acceso" className="promo promo-blue">
                <div>
                  <span className="eyebrow">ENTRA AL JUEGO</span>
                  <h3>
                    Tu próxima skin
                    <br />
                    te está esperando.
                  </h3>
                  <span>
                    Crear cuenta <ArrowRight size={15} />
                  </span>
                </div>
                <Target size={100} />
              </Link>
            </div>
            <section className="catalog-section">
              <div className="section-heading">
                <h2>
                  <Clock3 />
                  Últimas skins añadidas
                </h2>
                <Link className="text-link" to="/productos">
                  Ver todas <ArrowRight size={15} />
                </Link>
              </div>
              <div className="product-grid row row-cols-2 row-cols-md-3 row-cols-xl-4 row-cols-xxl-6 g-2">
                {state.products.slice(6, 12).map((p) => (
                  <div className="col" key={p.id}><ProductCard product={p} compact /></div>
                ))}
              </div>
            </section>
            <div className="market-bottom">
              <span>
                <Crosshair /> SOLO COUNTER-STRIKE 2
              </span>
              <span>24 SKINS ICÓNICAS / UN SOLO MERCADO</span>
              <span>
                EL SIGUIENTE NIVEL ES TUYO <ArrowRight size={15} />
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
function ShieldMark() {
  return <Swords size={28} />;
}
