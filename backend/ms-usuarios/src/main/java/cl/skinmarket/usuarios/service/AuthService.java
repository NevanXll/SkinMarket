package cl.skinmarket.usuarios.service;

import cl.skinmarket.common.dto.*;
import cl.skinmarket.common.model.*;
import cl.skinmarket.common.repository.*;
import cl.skinmarket.common.exception.ApiException;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;

@Service
public class AuthService {
 private final AccountRepository accounts; private final RefreshRepository sessions; private final PasswordEncoder passwords; private final JwtEncoder encoder;
 public AuthService(AccountRepository a,RefreshRepository s,PasswordEncoder p,JwtEncoder e) {accounts=a;sessions=s;passwords=p;encoder=e;}
 public record Session(Map<String,Object> body,String refresh) {}
 public static String email(String value) {return value.trim().toLowerCase(Locale.ROOT);}
 public static void checkPassword(String value) {
  if(value==null || value.length()<6 || value.getBytes(StandardCharsets.UTF_8).length>72) throw new ApiException(HttpStatus.BAD_REQUEST,"La contraseña requiere al menos 6 caracteres y máximo 72 bytes.");
 }
 @Transactional public Session register(Requests.Register r) {
  checkPassword(r.password());
  if(r.name().trim().length()<3) throw new ApiException(HttpStatus.BAD_REQUEST,"El nombre debe tener al menos 3 caracteres.");
  if(accounts.existsByEmail(email(r.email()))) throw ApiException.conflict("Este correo ya está registrado.");
  var a=new Account();a.id=UUID.randomUUID().toString();a.name=r.name().trim();a.email=email(r.email());a.passwordHash=passwords.encode(r.password());accounts.saveAndFlush(a);
  return issue(a);
 }
 @Transactional public Session login(Requests.Login r) {
  checkPassword(r.password());
  var a=accounts.findByEmail(email(r.email())).orElse(null);
  // Coste BCrypt también cuando el correo no existe.
  String hash=a==null?"$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxwY1YjN8JZ68rY4HoP2sEFJMWK":a.passwordHash;
  boolean matches=passwords.matches(r.password(),hash);
  if(a==null||!matches||a.blocked) throw new ApiException(HttpStatus.UNAUTHORIZED,"Correo o contraseña incorrectos, o cuenta bloqueada.");
  return issue(a);
 }
 @Transactional public Session refresh(String token) {
  if(token==null) throw unauthorized();
  var session=sessions.lockByHash(hash(token)).orElseThrow(AuthService::unauthorized);
  if(session.expiresAt.isBefore(Instant.now())) throw unauthorized();
  var a=accounts.findById(session.userId).orElseThrow(AuthService::unauthorized);
  if(a.blocked||a.authVersion!=session.authVersion) throw unauthorized();
  sessions.delete(session);sessions.flush();return issue(a);
 }
 @Transactional public void logout(String token) {
  if(token!=null) sessions.findById(hash(token)).ifPresent(sessions::delete);
 }
 private Session issue(Account a) {
  Instant now=Instant.now();
  var claims=JwtClaimsSet.builder().issuer("skinmarket").subject(a.id).issuedAt(now).expiresAt(now.plusSeconds(900)).claim("ver",a.authVersion).build();
  String access=encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),claims)).getTokenValue();
  byte[] bytes=new byte[48];new SecureRandom().nextBytes(bytes);String refresh=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  var session=new RefreshSession();session.hash=hash(refresh);session.userId=a.id;session.authVersion=a.authVersion;session.expiresAt=now.plusSeconds(604800);sessions.save(session);
  return new Session(Map.of("accessToken",access,"expiresIn",900,"user",Views.user(a)),refresh);
 }
 private static ApiException unauthorized(){return new ApiException(HttpStatus.UNAUTHORIZED,"La sesión ha expirado. Inicia sesión nuevamente.");}
 private static String hash(String token) {try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
}
