package cl.skinmarket.common.dto;
import cl.skinmarket.common.model.*;
import java.util.*;
public final class Views {
 public static Map<String,Object> user(Account a) {
  return Map.of("id",a.id,"name",a.name,"email",a.email,"role",a.role,"blocked",a.blocked,"balance",a.balance);
 }
 public static Map<String,Object> profile(Account a) {
  var view = new LinkedHashMap<>(user(a));
  view.put("avatar", a.avatar);
  view.put("bio", a.bio);
  view.put("showEmail", a.showEmail);
  view.put("showHeaderBalance", a.showHeaderBalance);
  view.put("avatarPhoto", a.avatarPhoto);
  view.put("birthDate", a.birthDate);
  view.put("location", a.profileLocation);
  view.put("showBirthDate", a.showBirthDate);
  view.put("showLocation", a.showLocation);
  view.put("showHeaderName", a.showHeaderName);
  return view;
 }
 public static Map<String,Object> cart(CartItem c) { return Map.of("productId",c.productId,"quantity",c.quantity); }
}
