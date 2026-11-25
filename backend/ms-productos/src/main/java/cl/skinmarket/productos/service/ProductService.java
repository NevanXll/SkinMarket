package cl.skinmarket.productos.service;

import cl.skinmarket.common.exception.ApiException;
import cl.skinmarket.common.model.Product;
import cl.skinmarket.common.repository.CartRepository;
import cl.skinmarket.common.repository.ProductRepository;
import cl.skinmarket.productos.dto.ProductInput;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {
    private final ProductRepository products;
    private final CartRepository carts;

    public ProductService(ProductRepository products, CartRepository carts) {
        this.products = products;
        this.carts = carts;
    }

    public List<Product> list() {
        return products.listMarket();
    }

    public Product get(String id) {
        return products.findMarketProduct(id).orElseThrow(ApiException::missing);
    }

    @Transactional
    public Product create(ProductInput input) {
        var product = new Product();
        product.id = UUID.randomUUID().toString();
        apply(product, input);
        return products.saveAndFlush(product);
    }

    @Transactional
    public Product update(String id, ProductInput input) {
        var product = lockActiveProduct(id);
        if (product.isResale()) {
            throw ApiException.conflict("El vendedor gestiona el precio y la cantidad de esta publicación.");
        }
        apply(product, input);
        return products.saveAndFlush(product);
    }

    @Transactional
    public void delete(String id) {
        var product = lockActiveProduct(id);
        product.deleted = true;
        carts.deleteByProductId(id);
    }

    private Product lockActiveProduct(String id) {
        return products.lockById(id).filter(product -> !product.deleted).orElseThrow(ApiException::missing);
    }

    private void apply(Product product, ProductInput input) {
        String name = input.name().trim();
        if (name.length() < 3) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nombre demasiado corto.");
        }

        var parts = name.split(" \\| ", 2);
        product.name = name;
        product.weapon = parts[0];
        product.finish = parts.length > 1 ? parts[1] : "Edición especial";
        product.category = input.category();
        product.rarity = input.rarity();
        product.price = input.price();
        product.stock = input.stock();
        product.collection = input.collection() == null ? "Sin colección" : input.collection();
        product.wear = input.wear() == null ? "Factory New" : input.wear();
        product.image = input.image();
        product.color = input.color() == null ? "#8b4dff" : input.color();
        product.featured = input.featured();
    }
}
