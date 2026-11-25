package cl.skinmarket.common.model;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
@Entity @Table(name="products")
public class Product {
 @Id public String id;
 @Column(nullable=false,length=100) public String name;
 public String weapon;
 public String finish;
 @Column(nullable=false) public String category;
 @Column(nullable=false) public String rarity;
 public String color;
 @Column(nullable=false,precision=19,scale=2) public BigDecimal price;
 @Column(nullable=false) public int stock;
 public String collection;
 public String wear;
 @Column(nullable=false,length=1000) public String image;
 public boolean featured;
 public boolean deleted;
 @JsonIgnore @Column(name="seller_id",length=64) public String sellerId;
 @JsonIgnore @Column(name="source_order_id",length=64) public String sourceOrderId;
 @JsonIgnore @Column(name="source_product_id",length=64) public String sourceProductId;
 @JsonIgnore @Column(name="acquired_quantity",nullable=false) public int acquiredQuantity;
 @JsonIgnore @Column(name="sold_units",nullable=false) public int soldUnits;
 @Version public long version;
 public Product() {}
 public boolean isResale() { return sellerId != null; }
}
