package cl.skinmarket.usuarios.controller;
import cl.skinmarket.common.dto.Requests;
import cl.skinmarket.usuarios.service.AuthService;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/auth")
public class AuthController {
 private final AuthService auth; private final boolean secure;
 public AuthController(AuthService a,@Value("${app.cookie-secure}") boolean s){auth=a;secure=s;}
 @PostMapping("/register") public ResponseEntity<?> register(@Valid @RequestBody Requests.Register r){return response(auth.register(r),201);}
 @PostMapping("/login") public ResponseEntity<?> login(@Valid @RequestBody Requests.Login r){return response(auth.login(r),200);}
 @PostMapping("/refresh") public ResponseEntity<?> refresh(@CookieValue(name="sm_refresh",required=false) String token){return response(auth.refresh(token),200);}
 @PostMapping("/logout") public ResponseEntity<?> logout(@CookieValue(name="sm_refresh",required=false) String token){auth.logout(token);return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE,cookie("",0)).build();}
 private ResponseEntity<?> response(AuthService.Session s,int status){return ResponseEntity.status(status).header(HttpHeaders.SET_COOKIE,cookie(s.refresh(),604800)).body(s.body());}
 private String cookie(String value,long age){return ResponseCookie.from("sm_refresh",value).httpOnly(true).secure(secure).sameSite("Strict").path("/api/v1/auth").maxAge(Duration.ofSeconds(age)).build().toString();}
}
