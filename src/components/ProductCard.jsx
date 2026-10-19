import { ShoppingCart, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMarket } from "../context/MarketContext";
import { imageUrl, money } from "../lib/market";
export default function ProductCard({ product, compact = false }) {
  const { state, user, addToCart, notify } = useMarket();
  const navigate = useNavigate();
  function add() {
    if (!user) {
      notify("Inicia sesión para añadir skins.", "error");
      navigate("/acceso");
      return;
    }
    try {
      addToCart(product.id);
    } catch (e) {
      notify(e.message, "error");
    }
  }
  return (
    <article
      className={`product-card ${compact ? "compact" : ""}`}
      style={{ "--rarity": product.color }}
    >
      <div className="product-art">
        <span className="wear-label">
          {product.wear
            .split(" ")
            .map((word) => word[0])
            .join("")}
        </span>
        {product.featured && (
          <Star className="favorite" size={14} fill="currentColor" />
        )}
        <img src={imageUrl(product.image)} alt={product.name} loading="lazy" />
      </div>
      <div className="product-info">
        <span className="weapon-name">{product.weapon}</span>
        <h3>{product.finish}</h3>
        <p className="rarity">
          <i />
          {product.rarity}
        </p>
        <div className="price-line">
          <strong>{money(product.price, state.currency)}</strong>
          <small>
            {product.stock ? `${product.stock} disponibles` : "Agotado"}
          </small>
        </div>
        {!compact && (
          <button
            className="button add-button"
            onClick={add}
            disabled={!product.stock}
          >
            <ShoppingCart size={14} />
            {product.stock ? "Añadir al carrito" : "Sin stock"}
          </button>
        )}
      </div>
    </article>
  );
}
