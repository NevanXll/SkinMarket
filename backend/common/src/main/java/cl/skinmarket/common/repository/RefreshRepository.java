package cl.skinmarket.common.repository;
import cl.skinmarket.common.model.RefreshSession;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface RefreshRepository extends JpaRepository<RefreshSession,String> {
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select r from RefreshSession r where r.hash=:hash")
 Optional<RefreshSession> lockByHash(String hash);
 void deleteByUserId(String userId);
}
