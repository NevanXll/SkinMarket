package cl.skinmarket.common.repository;
import cl.skinmarket.common.model.Product;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface ProductRepository extends JpaRepository<Product,String> {
 List<Product> findByDeletedFalseOrderByNameAsc();
 Optional<Product> findByIdAndDeletedFalse(String id);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select p from Product p where p.id=:id")
 Optional<Product> lockById(String id);
}
