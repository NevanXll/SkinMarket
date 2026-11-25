package cl.skinmarket.common.repository;
import cl.skinmarket.common.model.Account;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface AccountRepository extends JpaRepository<Account,String> {
 Optional<Account> findByEmail(String email);
 boolean existsByEmail(String email);
 boolean existsByIdAndRoleAndBlockedFalse(String id, String role);
 long countByRoleAndBlockedFalse(String role);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select a from Account a where a.id=:id")
 Optional<Account> lockById(String id);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select a from Account a order by a.id")
 List<Account> lockAll();
}
