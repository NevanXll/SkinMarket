package cl.skinmarket.usuarios.controller;
import cl.skinmarket.common.dto.Requests;
import cl.skinmarket.usuarios.service.UserService;
import cl.skinmarket.usuarios.dto.ProfileInput;
import jakarta.validation.Valid;
import java.net.URI;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
public class UserController {
 private final UserService users;public UserController(UserService u){users=u;}
 @GetMapping("/api/v1/me") public Object me(Principal p){return users.profile(p.getName());}
 @PutMapping("/api/v1/me/profile") public Object profile(Principal p,@Valid @RequestBody ProfileInput input){return users.updateProfile(p.getName(),input);}
 @GetMapping("/api/v1/admin/users") @PreAuthorize("hasRole('ADMIN')") public Object list(){return users.list();}
 @GetMapping("/api/v1/admin/users/{id}") @PreAuthorize("hasRole('ADMIN')") public Object get(@PathVariable String id){return users.get(id);}
 @PostMapping("/api/v1/admin/users") @PreAuthorize("hasRole('ADMIN')") public ResponseEntity<?> create(@Valid @RequestBody Requests.UserInput r){var a=users.create(r);return ResponseEntity.created(URI.create("/api/v1/admin/users/"+a.get("id"))).body(a);}
 @PutMapping("/api/v1/admin/users/{id}") @PreAuthorize("hasRole('ADMIN')") public Object update(Principal p,@PathVariable String id,@Valid @RequestBody Requests.UserInput r){return users.update(p.getName(),id,r);}
 @DeleteMapping("/api/v1/admin/users/{id}") @PreAuthorize("hasRole('ADMIN')") public ResponseEntity<?> delete(Principal p,@PathVariable String id){users.delete(p.getName(),id);return ResponseEntity.noContent().build();}
}
