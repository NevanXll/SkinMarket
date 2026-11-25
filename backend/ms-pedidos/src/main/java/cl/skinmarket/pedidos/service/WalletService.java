package cl.skinmarket.pedidos.service;

import cl.skinmarket.common.dto.Views;
import cl.skinmarket.common.exception.ApiException;
import cl.skinmarket.common.model.WalletPackage;
import cl.skinmarket.common.model.WalletTopUp;
import cl.skinmarket.common.repository.AccountRepository;
import cl.skinmarket.common.repository.WalletPackageRepository;
import cl.skinmarket.common.repository.WalletTopUpRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WalletService {
 private final AccountRepository accounts;
 private final WalletPackageRepository packages;
 private final WalletTopUpRepository topUps;

 public WalletService(AccountRepository accounts, WalletPackageRepository packages, WalletTopUpRepository topUps) {
  this.accounts = accounts;
  this.packages = packages;
  this.topUps = topUps;
 }

 public List<PackageView> packages() {
  return packages.findAllByOrderByCreditsAsc().stream().map(PackageView::from).toList();
 }

 @Transactional
 public PackageView updatePrice(String id, BigDecimal priceUsd) {
  var pack = packages.lockById(id).orElseThrow(ApiException::missing);
  pack.priceUsd = priceUsd;
  return PackageView.from(pack);
 }

 @Transactional
 public Map<String, Object> topUp(String userId, String packageId, BigDecimal expectedPrice, String requestKey) {
  var account = accounts.lockById(userId).orElseThrow(ApiException::missing);
  if (account.blocked) throw ApiException.denied();

  var previous = topUps.findByUserIdAndRequestKey(userId, requestKey);
  if (previous.isPresent()) {
   if (!previous.get().packageId.equals(packageId)) {
    throw ApiException.conflict("Esta solicitud ya se usó con otro paquete.");
   }
   return Views.user(account);
  }

  var pack = packages.lockById(packageId).orElseThrow(ApiException::missing);
  if (pack.priceUsd.compareTo(expectedPrice) != 0) {
   throw ApiException.conflict("El precio cambió. Selecciona nuevamente el paquete.");
  }

  account.balance = account.balance.add(pack.credits);
  var receipt = new WalletTopUp();
  receipt.id = UUID.randomUUID().toString();
  receipt.userId = userId;
  receipt.packageId = packageId;
  receipt.requestKey = requestKey;
  topUps.save(receipt);
  return Views.user(account);
 }

 public record PackageView(String id, BigDecimal credits, BigDecimal priceUsd) {
  static PackageView from(WalletPackage pack) {
   return new PackageView(pack.id, pack.credits, pack.priceUsd);
  }
 }
}
