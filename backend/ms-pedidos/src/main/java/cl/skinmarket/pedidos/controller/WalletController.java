package cl.skinmarket.pedidos.controller;

import cl.skinmarket.pedidos.service.WalletService;
import cl.skinmarket.pedidos.service.WalletService.PackageView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class WalletController {
 private final WalletService wallet;

 public WalletController(WalletService wallet) {
  this.wallet = wallet;
 }

 @GetMapping("/api/v1/wallet/packages")
 public List<PackageView> packages() {
  return wallet.packages();
 }

 @PutMapping("/api/v1/admin/wallet/packages/{id}")
 @PreAuthorize("hasRole('ADMIN')")
 public PackageView updatePrice(@PathVariable String id, @Valid @RequestBody Price input) {
  return wallet.updatePrice(id, input.priceUsd());
 }

 @PostMapping("/api/v1/wallet/packages/{id}/top-up")
 public Map<String, Object> topUp(Principal user, @PathVariable String id, @Valid @RequestBody Recharge input) {
  return wallet.topUp(user.getName(), id, input.expectedPrice(), input.requestKey());
 }

 public record Price(
  @NotNull @DecimalMin("0.01") @DecimalMax("100000") @Digits(integer = 6, fraction = 2) BigDecimal priceUsd
 ) {}

 public record Recharge(
  @NotNull @DecimalMin("0.01") @DecimalMax("100000") @Digits(integer = 6, fraction = 2) BigDecimal expectedPrice,
  @NotBlank @Size(max = 80) String requestKey
 ) {}
}
