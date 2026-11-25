package cl.skinmarket.common.model;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="refresh_sessions")
public class RefreshSession {
 @Id public String hash;
 @Column(name="user_id",nullable=false) public String userId;
 @Column(name="expires_at",nullable=false) public Instant expiresAt;
 @Column(name="auth_version",nullable=false) public long authVersion;
 public RefreshSession() {}
}
