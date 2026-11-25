package cl.skinmarket.productos.controller;

import cl.skinmarket.common.model.Product;
import cl.skinmarket.productos.dto.ProductInput;
import cl.skinmarket.productos.service.ProductService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    private final ProductService products;

    public ProductController(ProductService products) {
        this.products = products;
    }

    @GetMapping
    public List<Product> list() {
        return products.list();
    }

    @GetMapping("/{id}")
    public Product get(@PathVariable String id) {
        return products.get(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> create(@Valid @RequestBody ProductInput input) {
        var product = products.create(input);
        return ResponseEntity.created(URI.create("/api/v1/products/" + product.id)).body(product);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Product update(@PathVariable String id, @Valid @RequestBody ProductInput input) {
        return products.update(id, input);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        products.delete(id);
        return ResponseEntity.noContent().build();
    }
}
