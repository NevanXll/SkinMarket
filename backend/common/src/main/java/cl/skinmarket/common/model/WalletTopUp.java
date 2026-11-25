package cl.skinmarket.common.model;

import jakarta.persistence.*;

@Entity
@Table(name = "wallet_top_ups", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "request_key"}))
public class WalletTopUp {
 @Id @Column(length = 64) public String id;
 @Column(name = "user_id", length = 64, nullable = false) public String userId;
 @Column(name = "request_key", length = 80, nullable = false) public String requestKey;
 @Column(name = "package_id", length = 32, nullable = false) public String packageId;
}
