package cl.skinmarket.pedidos.controller;

import cl.skinmarket.pedidos.service.SellerMarketService;
import cl.skinmarket.pedidos.service.SellerMarketService.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/seller")
@PreAuthorize("hasRole('VENDEDOR')")
public class SellerMarketController {
 private final SellerMarketService market;

 public SellerMarketController(SellerMarketService market) { this.market=market; }

 @GetMapping("/listings")
 public SellerListings listings(Principal user) { return market.listings(user.getName()); }

 @PostMapping("/listings")
 @ResponseStatus(HttpStatus.CREATED)
 public Listing publish(Principal user,@Valid @RequestBody Publish input) {
  return market.publish(user.getName(),input.orderId(),input.productId(),input.price(),input.quantity());
 }

 @PutMapping("/listings/{id}")
 public Listing update(Principal user,@PathVariable String id,@Valid @RequestBody Update input) {
  return market.update(user.getName(),id,input.price(),input.quantity());
 }

 @GetMapping("/orders")
 public List<Sale> sales(Principal user) { return market.sales(user.getName()); }

 @GetMapping("/orders/{id}")
 public Sale sale(Principal user,@PathVariable String id) { return market.sale(user.getName(),id); }

 public record Publish(
  @NotBlank @Size(max=64) String orderId,
  @NotBlank @Size(max=64) String productId,
  @NotNull @DecimalMin("0.01") @DecimalMax("999999999.99") @Digits(integer=9,fraction=2) BigDecimal price,
  @NotNull @Min(1) Integer quantity
 ) {}
 public record Update(
  @NotNull @DecimalMin("0.01") @DecimalMax("999999999.99") @Digits(integer=9,fraction=2) BigDecimal price,
  @NotNull @Min(0) Integer quantity
 ) {}
}
