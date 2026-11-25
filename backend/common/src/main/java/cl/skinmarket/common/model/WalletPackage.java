package cl.skinmarket.common.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "wallet_packages")
public class WalletPackage {
 @Id @Column(length = 32) public String id;
 @Column(nullable = false, precision = 12, scale = 2) public BigDecimal credits;
 @Column(name = "price_usd", nullable = false, precision = 12, scale = 2) public BigDecimal priceUsd;
}
