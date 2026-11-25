package cl.skinmarket.usuarios.config;
import cl.skinmarket.common.model.Account;
import cl.skinmarket.common.repository.AccountRepository;
import cl.skinmarket.usuarios.service.AuthService;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
@Configuration
public class BootstrapAdmin {
 @Bean CommandLineRunner initialAdmin(AccountRepository accounts,PasswordEncoder passwords,Environment env){return args->{
  String email=env.getProperty("BOOTSTRAP_ADMIN_EMAIL"),password=env.getProperty("BOOTSTRAP_ADMIN_PASSWORD");
  if(accounts.countByRoleAndBlockedFalse("ADMIN")==0&&email!=null&&password!=null){
   AuthService.checkPassword(password);var a=new Account();a.id=UUID.randomUUID().toString();a.name="Administrador";a.email=AuthService.email(email);a.role="ADMIN";a.passwordHash=passwords.encode(password);accounts.save(a);
  }
 };}
}
