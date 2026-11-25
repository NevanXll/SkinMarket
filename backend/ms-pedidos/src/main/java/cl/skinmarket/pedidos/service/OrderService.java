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
 private final AccountRepository accounts;private final ProductRepository products;private final CartRepository carts;private final PurchaseRepository purchases;private final SellerSaleRepository sellerSales;private final ObjectMapper json;
 public OrderService(AccountRepository a,ProductRepository p,CartRepository c,PurchaseRepository o,SellerSaleRepository s,ObjectMapper j){accounts=a;products=p;carts=c;purchases=o;sellerSales=s;json=j;}
 public List<Map<String,Object>> cart(String id){return carts.findByUserIdOrderByProductId(id).stream().map(Views::cart).toList();}
 @Transactional public List<Map<String,Object>> quantity(String id,String productId,int quantity){
  activeLocked(id);var p=products.lockById(productId).filter(x->!x.deleted).orElseThrow(ApiException::missing);
  if(quantity>0) verifyListingAvailable(p,id);
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
   verifyListingAvailable(p,id);
   if(line.quantity<=0||p.stock<line.quantity)throw ApiException.conflict("Stock insuficiente.");
   Map<String,Object> snapshot=json.convertValue(p,new TypeReference<>(){});snapshot.remove("deleted");snapshot.remove("version");snapshot.put("quantity",line.quantity);items.add(snapshot);locked.add(p);
   total=total.add(p.price.multiply(BigDecimal.valueOf(line.quantity)));
  }
  total=total.setScale(2,RoundingMode.HALF_UP);if(account.balance.compareTo(total)<0)throw ApiException.conflict("Saldo insuficiente.");
  var order=new Purchase();order.id=UUID.randomUUID().toString();order.userId=id;order.requestKey=requestKey;order.date=Instant.now();order.total=total;
  try{order.itemsJson=json.writeValueAsString(items);}catch(Exception e){throw new IllegalStateException(e);}
  account.balance=account.balance.subtract(total);
  purchases.save(order);
  for(int i=0;i<locked.size();i++) {
   var product=locked.get(i);
   int quantity=cart.get(i).quantity;
   product.stock-=quantity;
   if(product.isResale()) {
    product.soldUnits+=quantity;
    sellerSales.save(sale(order,product,quantity));
   }
  }
  carts.deleteByUserId(id);return view(order);
 }
 public List<Map<String,Object>> orders(String id){return purchases.findByUserIdOrderByDateDesc(id).stream().map(this::view).toList();}
 public List<Map<String,Object>> allOrders(){return purchases.findAllByOrderByDateDesc().stream().map(this::view).toList();}
 public Map<String,Object> order(String actor,boolean admin,String id){var p=purchases.findById(id).orElseThrow(ApiException::missing);if(!admin&&!actor.equals(p.userId))throw ApiException.denied();return view(p);}
 public List<Map<String,Object>> inventory(String id){
  var result=new ArrayList<Map<String,Object>>();
  for(var purchase:purchases.findByUserIdOrderByDateDesc(id)) {
   for(var value:items(purchase)) {
    var item=new LinkedHashMap<>(value);
    int acquired=((Number)item.get("quantity")).intValue();
    var listing=products.findBySourceOrderIdAndSourceProductId(purchase.id,item.get("id").toString());
    int remaining=acquired-listing.map(p->p.soldUnits).orElse(0);
    if(remaining<=0) continue;
    item.put("quantity",remaining);
    item.put("orderId",purchase.id);
    item.put("acquiredAt",purchase.date.toString());
    result.add(item);
   }
  }
  return result;
 }
 private void verifyListingAvailable(Product product,String buyerId) {
  if(!product.isResale()) return;
  if(product.sellerId.equals(buyerId)) throw ApiException.conflict("No puedes comprar tu propia publicación.");
  if(!accounts.existsByIdAndRoleAndBlockedFalse(product.sellerId,"VENDEDOR")) {
   throw ApiException.conflict("La publicación ya no está disponible.");
  }
 }
 private SellerSale sale(Purchase order,Product product,int quantity) {
  var sale=new SellerSale();
  sale.id=UUID.randomUUID().toString();
  sale.sellerId=product.sellerId;
  sale.purchaseId=order.id;
  sale.productId=product.id;
  sale.productName=product.name;
  sale.quantity=quantity;
  sale.unitPrice=product.price;
  sale.date=order.date;
  return sale;
 }
 private Account activeLocked(String id){var a=accounts.lockById(id).orElseThrow(ApiException::missing);if(a.blocked)throw ApiException.denied();return a;}
 List<Map<String,Object>> items(Purchase p) {
  try { return json.readValue(p.itemsJson,new TypeReference<>() {}); }
  catch(Exception e) { throw new IllegalStateException(e); }
 }
 private Map<String,Object> view(Purchase p){return Map.of("id",p.id,"userId",p.userId,"date",p.date.toString(),"total",p.total,"items",items(p));}
}
