package cl.skinmarket.common.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
@Entity @Table(name="accounts")
public class Account {
 @Id public String id;
 @Column(nullable=false,length=100) public String name;
 @Column(nullable=false,unique=true,length=254) public String email;
 @Column(name="password_hash",nullable=false) public String passwordHash;
 @Column(nullable=false) public String role = "CLIENTE";
 @Column(nullable=false) public boolean blocked;
 @Column(nullable=false,precision=19,scale=2) public BigDecimal balance = new BigDecimal("12500.00");
 @Column(name="auth_version",nullable=false) public long authVersion;
 @Version public long version;
 public Account() {}
}
