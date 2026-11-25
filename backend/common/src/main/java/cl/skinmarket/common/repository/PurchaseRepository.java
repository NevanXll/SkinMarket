package cl.skinmarket.common.repository;
import cl.skinmarket.common.model.Purchase;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface PurchaseRepository extends JpaRepository<Purchase,String> {
 List<Purchase> findByUserIdOrderByDateDesc(String userId);
 List<Purchase> findAllByOrderByDateDesc();
 Optional<Purchase> findByUserIdAndRequestKey(String userId,String requestKey);
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 @Query("select p from Purchase p where p.id = :id and p.userId = :userId")
 Optional<Purchase> lockOwnedPurchase(String id, String userId);
}
