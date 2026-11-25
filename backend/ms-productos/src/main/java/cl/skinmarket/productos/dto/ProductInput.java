package cl.skinmarket.productos.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductInput(
        @NotBlank @Size(min = 3, max = 100) @Pattern(regexp = "[^<>]+") String name,
        @NotBlank @Size(max = 100) String category,
        @NotBlank @Size(max = 100) String rarity,
        @NotNull @DecimalMin("0") @DecimalMax("999999999.99") @Digits(integer = 9, fraction = 2) BigDecimal price,
        @NotNull @Min(0) Integer stock,
        @Size(max = 255) String collection,
        @Size(max = 100) String wear,
        @NotBlank @Size(max = 1000) @Pattern(regexp = "https://[^\\s]+|images/skins/[a-zA-Z0-9_-]+\\.png") String image,
        @Pattern(regexp = "#[a-fA-F0-9]{6}") String color,
        boolean featured
) {}
