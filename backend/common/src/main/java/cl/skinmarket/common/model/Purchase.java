package cl.skinmarket.common.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
@Entity @Table(name="purchases",uniqueConstraints=@UniqueConstraint(columnNames={"user_id","request_key"}))
public class Purchase {
 @Id public String id;
 @Column(name="user_id",nullable=false) public String userId;
 @Column(name="request_key",nullable=false) public String requestKey;
 @Column(name="created_at",nullable=false) public Instant date;
 @Column(nullable=false,precision=19,scale=2) public BigDecimal total;
 @Column(name="items_json",nullable=false,columnDefinition="LONGTEXT") public String itemsJson;
 public Purchase() {}
}
