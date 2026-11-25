package cl.skinmarket.pedidos.service;
import cl.skinmarket.common.dto.Views;
import cl.skinmarket.common.model.*;
import cl.skinmarket.common.repository.*;
import cl.skinmarket.common.exception.ApiException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
 private final AccountRepository accounts;private final ProductRepository products;private final CartRepository carts;private final PurchaseRepository purchases;private final ObjectMapper json;
 public OrderService(AccountRepository a,ProductRepository p,CartRepository c,PurchaseRepository o,ObjectMapper j){accounts=a;products=p;carts=c;purchases=o;json=j;}
 public List<Map<String,Object>> cart(String id){return carts.findByUserIdOrderByProductId(id).stream().map(Views::cart).toList();}
 @Transactional public List<Map<String,Object>> quantity(String id,String productId,int quantity){
  activeLocked(id);var p=products.lockById(productId).filter(x->!x.deleted).orElseThrow(ApiException::missing);
  if(quantity>p.stock)throw ApiException.conflict("Stock insuficiente.");
  var old=carts.findByUserIdAndProductId(id,productId);
  if(quantity==0)old.ifPresent(carts::delete);else {var c=old.orElseGet(CartItem::new);if(c.id==null)c.id=UUID.randomUUID().toString();c.userId=id;c.productId=productId;c.quantity=quantity;carts.save(c);}
  carts.flush();return cart(id);
 }
 @Transactional public Map<String,Object> topUp(String id,BigDecimal amount){var a=activeLocked(id);a.balance=a.balance.add(amount).setScale(2,RoundingMode.HALF_UP);return Views.user(accounts.saveAndFlush(a));}
 @Transactional public Map<String,Object> checkout(String id,String requestKey){
  var account=activeLocked(id);
  var existing=purchases.findByUserIdAndRequestKey(id,requestKey);if(existing.isPresent())return view(existing.get());
  var cart=carts.findByUserIdOrderByProductId(id);if(cart.isEmpty())throw ApiException.conflict("Tu carrito está vacío.");
  // Mismo orden de bloqueo entre peticiones. La transacción engloba saldo, stock y pedido en MySQL.
  var items=new ArrayList<Map<String,Object>>();var locked=new ArrayList<Product>();BigDecimal total=BigDecimal.ZERO;
  for(var line:cart){
   var p=products.lockById(line.productId).filter(x->!x.deleted).orElseThrow(()->ApiException.conflict("Producto no disponible."));
   if(line.quantity<=0||p.stock<line.quantity)throw ApiException.conflict("Stock insuficiente.");
   Map<String,Object> snapshot=json.convertValue(p,new TypeReference<>(){});snapshot.remove("deleted");snapshot.remove("version");snapshot.put("quantity",line.quantity);items.add(snapshot);locked.add(p);
   total=total.add(p.price.multiply(BigDecimal.valueOf(line.quantity)));
  }
  total=total.setScale(2,RoundingMode.HALF_UP);if(account.balance.compareTo(total)<0)throw ApiException.conflict("Saldo insuficiente.");
  var order=new Purchase();order.id=UUID.randomUUID().toString();order.userId=id;order.requestKey=requestKey;order.date=Instant.now();order.total=total;
  try{order.itemsJson=json.writeValueAsString(items);}catch(Exception e){throw new IllegalStateException(e);}
  account.balance=account.balance.subtract(total);
  for(int i=0;i<locked.size();i++)locked.get(i).stock-=cart.get(i).quantity;
  purchases.saveAndFlush(order);carts.deleteByUserId(id);return view(order);
 }
 public List<Map<String,Object>> orders(String id){return purchases.findByUserIdOrderByDateDesc(id).stream().map(this::view).toList();}
 public List<Map<String,Object>> allOrders(){return purchases.findAllByOrderByDateDesc().stream().map(this::view).toList();}
 public Map<String,Object> order(String actor,boolean admin,String id){var p=purchases.findById(id).orElseThrow(ApiException::missing);if(!admin&&!actor.equals(p.userId))throw ApiException.denied();return view(p);}
 public List<Map<String,Object>> inventory(String id){
  var result=new ArrayList<Map<String,Object>>();for(var o:orders(id))for(Object value:(List<?>)o.get("items")){
   @SuppressWarnings("unchecked") var item=new LinkedHashMap<>((Map<String,Object>)value);item.put("orderId",o.get("id"));item.put("acquiredAt",o.get("date"));result.add(item);
  }return result;
 }
 private Account activeLocked(String id){var a=accounts.lockById(id).orElseThrow(ApiException::missing);if(a.blocked||"VENDEDOR".equals(a.role))throw ApiException.denied();return a;}
 private Map<String,Object> view(Purchase p){try{return Map.of("id",p.id,"userId",p.userId,"date",p.date.toString(),"total",p.total,"items",json.readValue(p.itemsJson,List.class));}catch(Exception e){throw new IllegalStateException(e);}}
}
