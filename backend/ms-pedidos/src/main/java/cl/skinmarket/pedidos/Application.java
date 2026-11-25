package cl.skinmarket.pedidos;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
@SpringBootApplication(scanBasePackages={"cl.skinmarket.common","cl.skinmarket.pedidos"})
@EntityScan("cl.skinmarket.common.model") @EnableJpaRepositories("cl.skinmarket.common.repository")
public class Application { public static void main(String[] args) { SpringApplication.run(Application.class,args); } }
