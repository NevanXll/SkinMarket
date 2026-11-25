package cl.skinmarket.common.repository;
import cl.skinmarket.common.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface PurchaseRepository extends JpaRepository<Purchase,String> {
 List<Purchase> findByUserIdOrderByDateDesc(String userId);
 List<Purchase> findAllByOrderByDateDesc();
 Optional<Purchase> findByUserIdAndRequestKey(String userId,String requestKey);
}
