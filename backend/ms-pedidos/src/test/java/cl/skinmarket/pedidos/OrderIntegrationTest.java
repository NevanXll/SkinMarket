package cl.skinmarket.pedidos;
import cl.skinmarket.common.model.*;
import cl.skinmarket.common.repository.*;
import cl.skinmarket.pedidos.service.OrderService;
import java.math.BigDecimal;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:orders;MODE=MySQL;DB_CLOSE_DELAY=-1","spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=","spring.flyway.enabled=false","spring.jpa.hibernate.ddl-auto=create-drop","app.jwt-secret=integration-test-secret-32-characters-minimum"})
class OrderIntegrationTest {
 @Autowired AccountRepository accounts; @Autowired ProductRepository products; @Autowired CartRepository carts; @Autowired PurchaseRepository orders; @Autowired OrderService service;
 @BeforeEach void setup(){carts.deleteAll();orders.deleteAll();products.deleteAll();accounts.deleteAll();var a=new Account();a.id="client";a.name="Cliente";a.email="client@example.com";a.passwordHash="hash";a.balance=new BigDecimal("100.00");accounts.saveAndFlush(a);var p=new Product();p.id="skin";p.name="AK | Skin";p.category="Rifles";p.rarity="Covert";p.image="images/skins/skin.png";p.price=new BigDecimal("30.00");p.stock=2;products.saveAndFlush(p);}
 @Test void purchaseCommitsBalanceStockInventoryAndCart(){service.quantity("client","skin",2);service.checkout("client","request-1");assertEquals(0,products.findById("skin").orElseThrow().stock);assertEquals(new BigDecimal("40.00"),accounts.findById("client").orElseThrow().balance);assertTrue(service.cart("client").isEmpty());assertEquals(1,service.inventory("client").size());}
 @Test void insufficientBalanceRollsBackEverything(){var a=accounts.findById("client").orElseThrow();a.balance=BigDecimal.ONE;accounts.saveAndFlush(a);service.quantity("client","skin",2);assertThrows(RuntimeException.class,()->service.checkout("client","request-2"));assertEquals(2,products.findById("skin").orElseThrow().stock);assertEquals(0,orders.count());assertEquals(1,service.cart("client").size());}
 @Test void stockChangeIsRecheckedAtCheckout(){service.quantity("client","skin",2);var p=products.findById("skin").orElseThrow();p.stock=1;products.saveAndFlush(p);assertThrows(RuntimeException.class,()->service.checkout("client","request-3"));assertEquals(new BigDecimal("100.00"),accounts.findById("client").orElseThrow().balance);}
 @Test void retriesCannotChargeTwice(){service.quantity("client","skin",1);var first=service.checkout("client","same");var retry=service.checkout("client","same");assertEquals(first.get("id"),retry.get("id"));assertEquals(1,orders.count());assertEquals(new BigDecimal("70.00"),accounts.findById("client").orElseThrow().balance);}
 @Test void clientCannotReadAnotherUsersOrder(){service.quantity("client","skin",1);var order=service.checkout("client","one");assertThrows(RuntimeException.class,()->service.order("other",false,order.get("id").toString()));}
 @Test void emptyCartCannotCheckout(){assertThrows(RuntimeException.class,()->service.checkout("client","empty"));}
 @Test void quantitiesCannotExceedStock(){assertThrows(RuntimeException.class,()->service.quantity("client","skin",3));}
}
