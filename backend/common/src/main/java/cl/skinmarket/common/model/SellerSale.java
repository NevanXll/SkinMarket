package cl.skinmarket.common.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name="seller_sales")
public class SellerSale {
 @Id @Column(length=64) public String id;
 @Column(name="seller_id", length=64, nullable=false) public String sellerId;
 @Column(name="purchase_id", length=64, nullable=false) public String purchaseId;
 @Column(name="product_id", length=64, nullable=false) public String productId;
 @Column(name="product_name", length=100, nullable=false) public String productName;
 @Column(nullable=false) public int quantity;
 @Column(name="unit_price", precision=19, scale=2, nullable=false) public BigDecimal unitPrice;
 @Column(name="created_at",nullable=false) public Instant date;
}
