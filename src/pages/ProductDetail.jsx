import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true; setProduct(null); setError('');
    api(`/products/${encodeURIComponent(id)}`).then((p) => { if (active) setProduct(p); })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [id]);
  return <div className="page-container"><Link to="/productos">← Volver al mercado</Link>
    {error ? <p role="alert">{error}</p> : product ? <section>
      <h1>{product.name}</h1><p>{product.collection} · {product.wear}</p>
      <div style={{ maxWidth: 420 }}><ProductCard product={product} /></div>
    </section> : <p role="status">Cargando producto…</p>}
  </div>;
}
