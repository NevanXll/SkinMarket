package cl.skinmarket.common.dto;
import cl.skinmarket.common.model.*;
import java.util.*;
public final class Views {
 public static Map<String,Object> user(Account a) {
  return Map.of("id",a.id,"name",a.name,"email",a.email,"role",a.role,"blocked",a.blocked,"balance",a.balance);
 }
 public static Map<String,Object> cart(CartItem c) { return Map.of("productId",c.productId,"quantity",c.quantity); }
}
