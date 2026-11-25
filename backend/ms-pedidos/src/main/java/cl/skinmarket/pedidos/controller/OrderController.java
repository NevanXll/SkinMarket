package cl.skinmarket.pedidos.controller;
import cl.skinmarket.common.dto.Requests;
import cl.skinmarket.pedidos.service.OrderService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController
public class OrderController {
 private final OrderService orders;public OrderController(OrderService o){orders=o;}
 @GetMapping("/api/v1/cart") public Object cart(Principal p){return orders.cart(p.getName());}
 @PutMapping("/api/v1/cart/{id}") public Object quantity(Principal p,@PathVariable String id,@Valid @RequestBody Requests.Quantity q){return orders.quantity(p.getName(),id,q.quantity());}
 @PostMapping("/api/v1/wallet/top-up") public Object topUp(Principal p,@Valid @RequestBody Requests.Amount a){return orders.topUp(p.getName(),a.amount());}
 @PostMapping("/api/v1/orders") public ResponseEntity<?> checkout(Principal p,@Valid @RequestBody Requests.Checkout r){var order=orders.checkout(p.getName(),r.requestKey());return ResponseEntity.created(java.net.URI.create("/api/v1/orders/"+order.get("id"))).body(order);}
 @GetMapping("/api/v1/orders") public Object orders(Principal p){return orders.orders(p.getName());}
 @GetMapping("/api/v1/orders/{id}") public Object order(Authentication a,@PathVariable String id){return orders.order(a.getName(),a.getAuthorities().stream().anyMatch(r->r.getAuthority().equals("ROLE_ADMIN")),id);}
 @GetMapping("/api/v1/inventory") public Object inventory(Principal p){return orders.inventory(p.getName());}
 @GetMapping("/api/v1/admin/orders") @PreAuthorize("hasRole('ADMIN')") public Object all(){return orders.allOrders();}
 @GetMapping("/api/v1/seller/orders") @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')") public Object sellerOrders(){return orders.allOrders();}
 @GetMapping("/api/v1/seller/orders/{id}") @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')") public Object sellerOrder(@PathVariable String id){return orders.order(null,true,id);}
}
