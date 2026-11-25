package cl.skinmarket.common.repository;

import cl.skinmarket.common.model.WalletTopUp;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletTopUpRepository extends JpaRepository<WalletTopUp, String> {
 Optional<WalletTopUp> findByUserIdAndRequestKey(String userId, String requestKey);
}
