package cl.skinmarket.common.repository;

import cl.skinmarket.common.model.SellerSale;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SellerSaleRepository extends JpaRepository<SellerSale,String> {
 List<SellerSale> findBySellerIdOrderByDateDesc(String sellerId);
 List<SellerSale> findBySellerIdAndPurchaseId(String sellerId, String purchaseId);
}
