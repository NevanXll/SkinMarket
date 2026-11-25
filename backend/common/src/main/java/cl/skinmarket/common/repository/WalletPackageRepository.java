package cl.skinmarket.common.repository;

import cl.skinmarket.common.model.WalletPackage;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;

public interface WalletPackageRepository extends JpaRepository<WalletPackage, String> {
 List<WalletPackage> findAllByOrderByCreditsAsc();

 @Lock(LockModeType.PESSIMISTIC_WRITE)
 @Query("select p from WalletPackage p where p.id = :id")
 Optional<WalletPackage> lockById(String id);
}
