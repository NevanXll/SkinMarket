package cl.skinmarket.common.repository;

import cl.skinmarket.common.model.SellerApplication;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SellerApplicationRepository extends JpaRepository<SellerApplication, String> {
    List<SellerApplication> findAllByOrderBySubmittedAtDesc();
}
