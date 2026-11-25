package cl.skinmarket.common.repository;
import cl.skinmarket.common.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface CartRepository extends JpaRepository<CartItem,String> {
 List<CartItem> findByUserIdOrderByProductId(String userId);
 Optional<CartItem> findByUserIdAndProductId(String userId,String productId);
 void deleteByUserId(String userId);
 void deleteByProductId(String productId);
}
