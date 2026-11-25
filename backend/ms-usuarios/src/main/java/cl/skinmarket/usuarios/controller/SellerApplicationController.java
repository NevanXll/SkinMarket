package cl.skinmarket.usuarios.controller;

import cl.skinmarket.usuarios.service.SellerApplicationService;
import cl.skinmarket.usuarios.service.SellerApplicationService.ApplicationView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class SellerApplicationController {
    private final SellerApplicationService applications;

    public SellerApplicationController(SellerApplicationService applications) {
        this.applications = applications;
    }

    @GetMapping("/seller-application")
    @PreAuthorize("hasAnyRole('CLIENTE', 'VENDEDOR')")
    public ResponseEntity<ApplicationView> current(Principal principal) {
        var application = applications.current(principal.getName());
        return application == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(application);
    }

    @PostMapping("/seller-application")
    @PreAuthorize("hasRole('CLIENTE')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationView submit(Principal principal, @Valid @RequestBody ApplicationInput input) {
        return applications.submit(principal.getName(), input.skins(), input.reason());
    }

    @GetMapping("/admin/seller-applications")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ApplicationView> list() {
        return applications.list();
    }

    @PutMapping("/admin/seller-applications/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApplicationView review(@PathVariable String userId, @Valid @RequestBody ReviewInput input) {
        return applications.review(userId, input.approved(), input.note());
    }

    public record ApplicationInput(@NotBlank @Size(min = 3, max = 500) String skins,
                                   @NotBlank @Size(min = 10, max = 1000) String reason) {}
    public record ReviewInput(@NotNull Boolean approved, @Size(max = 500) String note) {}
}
