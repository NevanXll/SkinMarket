package cl.skinmarket.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProfileInput(
        @NotBlank @Size(min = 3, max = 100) String name,
        @NotBlank @Pattern(regexp = "initial|crosshair|shield|star") String avatar,
        @NotNull @Size(max = 240) String bio,
        @NotNull Boolean showEmail,
        @NotNull Boolean showHeaderBalance
) {}
