package cl.skinmarket.usuarios.service;
import cl.skinmarket.common.dto.*;
import cl.skinmarket.common.model.Account;
import cl.skinmarket.common.repository.*;
import cl.skinmarket.common.exception.ApiException;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class UserService {
 private final AccountRepository accounts;private final RefreshRepository sessions;private final PasswordEncoder passwords;
 public UserService(AccountRepository a,RefreshRepository s,PasswordEncoder p){accounts=a;sessions=s;passwords=p;}
 public List<Map<String,Object>> list(){return accounts.findAll().stream().map(Views::user).toList();}
 public Map<String,Object> get(String id){return Views.user(accounts.findById(id).orElseThrow(ApiException::missing));}
 @Transactional public Map<String,Object> create(Requests.UserInput r){
  if("VENDEDOR".equals(r.role()))throw ApiException.conflict("El rol Vendedor se asigna al aprobar una solicitud.");
  AuthService.checkPassword(r.password());validate(r,null);
  var a=new Account();a.id=UUID.randomUUID().toString();apply(a,r);a.passwordHash=passwords.encode(r.password());accounts.saveAndFlush(a);return Views.user(a);
 }
 @Transactional public Map<String,Object> update(String actor,String id,Requests.UserInput r){
  var all=accounts.lockAll();var a=all.stream().filter(u->u.id.equals(id)).findFirst().orElseThrow(ApiException::missing);validate(r,id);
  if("VENDEDOR".equals(r.role())&&!"VENDEDOR".equals(a.role))throw ApiException.conflict("El rol Vendedor se asigna al aprobar una solicitud.");
  if(actor.equals(id)&&(!r.role().equals("ADMIN")||Boolean.TRUE.equals(r.blocked())))throw ApiException.conflict("No puedes bloquearte ni quitarte tu propio rol.");
  boolean blocked=Boolean.TRUE.equals(r.blocked());
  if(a.role.equals("ADMIN")&&!a.blocked&&(!r.role().equals("ADMIN")||blocked)&&all.stream().filter(u->u.role.equals("ADMIN")&&!u.blocked).count()<=1)throw ApiException.conflict("Debe existir al menos un administrador activo.");
  if(!a.role.equals(r.role())||a.blocked!=blocked||!a.email.equals(AuthService.email(r.email()))){a.authVersion++;sessions.deleteByUserId(id);}
  apply(a,r);return Views.user(accounts.saveAndFlush(a));
 }
 @Transactional public void delete(String actor,String id){
  var all=accounts.lockAll();var a=all.stream().filter(u->u.id.equals(id)).findFirst().orElseThrow(ApiException::missing);
  if(actor.equals(id))throw ApiException.conflict("No puedes eliminar tu propia cuenta.");
  if(a.role.equals("ADMIN")&&!a.blocked&&all.stream().filter(u->u.role.equals("ADMIN")&&!u.blocked).count()<=1)throw ApiException.conflict("Debe quedar un administrador activo.");
  sessions.deleteByUserId(id);accounts.delete(a);accounts.flush();
 }
 private void validate(Requests.UserInput r,String id){
  if(r.name().trim().length()<3)throw new ApiException(HttpStatus.BAD_REQUEST,"El nombre debe tener al menos 3 caracteres.");
  accounts.findByEmail(AuthService.email(r.email())).filter(a->!a.id.equals(id)).ifPresent(a->{throw ApiException.conflict("Este correo ya está registrado.");});
 }
 private void apply(Account a,Requests.UserInput r){a.name=r.name().trim();a.email=AuthService.email(r.email());a.role=r.role();a.blocked=Boolean.TRUE.equals(r.blocked());}
}
