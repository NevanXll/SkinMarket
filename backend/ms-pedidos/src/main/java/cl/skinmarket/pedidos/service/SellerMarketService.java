package cl.skinmarket.pedidos.service;

import cl.skinmarket.common.exception.ApiException;
import cl.skinmarket.common.model.Product;
import cl.skinmarket.common.model.SellerSale;
import cl.skinmarket.common.repository.ProductRepository;
import cl.skinmarket.common.repository.PurchaseRepository;
import cl.skinmarket.common.repository.SellerSaleRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SellerMarketService {
 private final ProductRepository products;
 private final PurchaseRepository purchases;
 private final SellerSaleRepository sales;
 private final OrderService orders;

 public SellerMarketService(ProductRepository products, PurchaseRepository purchases, SellerSaleRepository sales, OrderService orders) {
  this.products=products;
  this.purchases=purchases;
  this.sales=sales;
  this.orders=orders;
 }

 public SellerListings listings(String sellerId) {
  var listings=products.findBySellerIdOrderByNameAsc(sellerId);
  var posted=new LinkedHashMap<List<String>,Product>();
  for(var listing:listings) posted.put(List.of(listing.sourceOrderId,listing.sourceProductId),listing);
  var inventory=new ArrayList<AvailableSkin>();
  for(var purchase:purchases.findByUserIdOrderByDateDesc(sellerId)) {
   for(var skin:orders.items(purchase)) {
    String productId=skin.get("id").toString();
    if(posted.containsKey(List.of(purchase.id,productId))) continue;
    inventory.add(new AvailableSkin(purchase.id,productId,(String)skin.get("name"),(String)skin.get("image"),
      ((Number)skin.get("quantity")).intValue(),purchase.date));
   }
  }
  return new SellerListings(listings.stream().map(Listing::from).toList(),inventory);
 }

 @Transactional
 public Listing publish(String sellerId,String orderId,String productId,BigDecimal price,int quantity) {
  var purchase=purchases.lockOwnedPurchase(orderId,sellerId).orElseThrow(ApiException::missing);
  var skin=orders.items(purchase).stream().filter(item->productId.equals(item.get("id"))).findFirst().orElseThrow(ApiException::missing);
  if(products.findBySourceOrderIdAndSourceProductId(orderId,productId).isPresent()) {
   throw ApiException.conflict("Ya existe una publicación para esta compra.");
  }
  var listing=new Product();
  listing.id=UUID.randomUUID().toString();
  listing.sellerId=sellerId;
  listing.sourceOrderId=orderId;
  listing.sourceProductId=productId;
  listing.acquiredQuantity=((Number)skin.get("quantity")).intValue();
  listing.name=(String)skin.get("name");
  listing.weapon=(String)skin.get("weapon");
  listing.finish=(String)skin.get("finish");
  listing.category=(String)skin.get("category");
  listing.rarity=(String)skin.get("rarity");
  listing.image=(String)skin.get("image");
  listing.color=(String)skin.get("color");
  listing.collection=(String)skin.get("collection");
  listing.wear=(String)skin.get("wear");
  apply(listing,price,quantity);
  return Listing.from(products.saveAndFlush(listing));
 }

 @Transactional
 public Listing update(String sellerId,String id,BigDecimal price,int quantity) {
  var listing=products.lockById(id).filter(p->sellerId.equals(p.sellerId) && !p.deleted).orElseThrow(ApiException::missing);
  apply(listing,price,quantity);
  return Listing.from(listing);
 }

 public List<Sale> sales(String sellerId) {
  var byOrder=new LinkedHashMap<String,List<SellerSale>>();
  for(var line:sales.findBySellerIdOrderByDateDesc(sellerId)) {
   byOrder.computeIfAbsent(line.purchaseId,id->new ArrayList<>()).add(line);
  }
  return byOrder.values().stream().map(Sale::from).toList();
 }

 public Sale sale(String sellerId,String purchaseId) {
  var lines=sales.findBySellerIdAndPurchaseId(sellerId,purchaseId);
  if(lines.isEmpty()) throw ApiException.missing();
  return Sale.from(lines);
 }

 private void apply(Product listing,BigDecimal price,int quantity) {
  if(quantity>listing.acquiredQuantity-listing.soldUnits) {
   throw ApiException.conflict("No tienes suficientes unidades disponibles para esta publicación.");
  }
  listing.price=price;
  listing.stock=quantity;
 }

 public record SellerListings(List<Listing> listings,List<AvailableSkin> inventory) {}
 public record AvailableSkin(String orderId,String productId,String name,String image,int quantity,Instant acquiredAt) {}
 public record Listing(String id,String name,String image,BigDecimal price,int stock,int available,int sold,boolean removed) {
  static Listing from(Product p) {
   return new Listing(p.id,p.name,p.image,p.price,p.stock,p.acquiredQuantity-p.soldUnits,p.soldUnits,p.deleted);
  }
 }
 public record Sale(String id,Instant date,BigDecimal total,List<SaleItem> items) {
  static Sale from(List<SellerSale> lines) {
   var first=lines.getFirst();
   var items=lines.stream().map(line->new SaleItem(line.productId,line.productName,line.unitPrice,line.quantity)).toList();
   var total=items.stream().map(item->item.price.multiply(BigDecimal.valueOf(item.quantity))).reduce(BigDecimal.ZERO,BigDecimal::add);
   return new Sale(first.purchaseId,first.date,total,items);
  }
 }
 public record SaleItem(String id,String name,BigDecimal price,int quantity) {}
}
