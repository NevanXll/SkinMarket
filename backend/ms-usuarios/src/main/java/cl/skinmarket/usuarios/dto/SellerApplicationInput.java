package cl.skinmarket.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SellerApplicationInput(
        @NotBlank @Size(min = 10, max = 1000) String reason,
        @Size(max = 500) String experience,
        @NotNull Boolean studies,
        @Size(max = 120) String institution,
        @NotBlank @Size(max = 80) String country,
        @NotBlank @Size(max = 100) String region,
        @NotBlank @Size(max = 100) String city,
        @Pattern(regexp = "[\\p{L}\\p{N} -]{0,16}") String postalCode
) {}
