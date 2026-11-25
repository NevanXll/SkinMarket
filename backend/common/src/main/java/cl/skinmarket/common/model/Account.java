package cl.skinmarket.common.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
@Entity @Table(name="accounts")
public class Account {
 @Id public String id;
 @Column(nullable=false,length=100) public String name;
 @Column(nullable=false,unique=true,length=254) public String email;
 @Column(name="password_hash",nullable=false) public String passwordHash;
 @Column(nullable=false) public String role = "CLIENTE";
 @Column(nullable=false) public boolean blocked;
 @Column(nullable=false,length=20) public String avatar = "initial";
 @Column(nullable=false,length=240) public String bio = "";
 @Column(name="show_email",nullable=false) public boolean showEmail;
 @Column(name="show_header_balance",nullable=false) public boolean showHeaderBalance = true;
 @Column(name="avatar_photo", columnDefinition="MEDIUMTEXT") public String avatarPhoto;
 @Column(name="birth_date") public LocalDate birthDate;
 @Column(name="profile_location",nullable=false,length=120) public String profileLocation = "";
 @Column(name="show_birth_date",nullable=false) public boolean showBirthDate;
 @Column(name="show_location",nullable=false) public boolean showLocation;
 @Column(name="show_header_name",nullable=false) public boolean showHeaderName = true;
 @Column(nullable=false,precision=19,scale=2) public BigDecimal balance = new BigDecimal("12500.00");
 @Column(name="auth_version",nullable=false) public long authVersion;
 @Version public long version;
 public Account() {}
}
