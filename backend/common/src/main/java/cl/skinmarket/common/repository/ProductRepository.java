package cl.skinmarket.common.repository;
import cl.skinmarket.common.model.Product;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface ProductRepository extends JpaRepository<Product,String> {
 String MARKET_VISIBLE = "p.deleted = false and (p.sellerId is null or (p.stock > 0 and exists "
   + "(select a.id from Account a where a.id = p.sellerId and a.role = 'VENDEDOR' and a.blocked = false)))";
 @Query("select p from Product p where " + MARKET_VISIBLE + " order by p.name")
 List<Product> listMarket();
 @Query("select p from Product p where p.id = :id and " + MARKET_VISIBLE)
 Optional<Product> findMarketProduct(String id);
 List<Product> findBySellerIdOrderByNameAsc(String sellerId);
 Optional<Product> findBySourceOrderIdAndSourceProductId(String orderId, String productId);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select p from Product p where p.id=:id")
 Optional<Product> lockById(String id);
}
