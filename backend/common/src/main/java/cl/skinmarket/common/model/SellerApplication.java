package cl.skinmarket.common.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "seller_applications")
public class SellerApplication {
    @Id @Column(name = "user_id", length = 64)
    public String userId;
    @Column(length = 500)
    public String experience;
    @Column(nullable = false, length = 1000)
    public String reason;
    @Column(nullable = false, length = 16)
    public String status;
    @Column(name = "submitted_at", nullable = false)
    public Instant submittedAt;
    @Column(name = "reviewed_at")
    public Instant reviewedAt;
    @Column(name = "review_note", length = 500)
    public String reviewNote;
}
