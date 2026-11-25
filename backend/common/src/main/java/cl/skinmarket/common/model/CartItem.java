package cl.skinmarket.common.model;
import jakarta.persistence.*;
@Entity @Table(name="cart_items",uniqueConstraints=@UniqueConstraint(columnNames={"user_id","product_id"}))
public class CartItem {
 @Id public String id;
 @Column(name="user_id",nullable=false) public String userId;
 @Column(name="product_id",nullable=false) public String productId;
 public int quantity;
 public CartItem() {}
}
