package cl.skinmarket.common.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public final class Requests {
 public record Register(@NotBlank @Size(min=3,max=100) String name,@NotBlank @Email @Pattern(regexp="[^\\s@]+@[^\\s@]+\\.[^\\s@]+") @Size(max=254) String email,@NotBlank @Size(min=6,max=72) String password) {}
 public record Login(@NotBlank @Email @Pattern(regexp="[^\\s@]+@[^\\s@]+\\.[^\\s@]+") @Size(max=254) String email,@NotBlank @Size(max=72) String password) {}
 public record UserInput(@NotBlank @Size(min=3,max=100) String name,@NotBlank @Email @Pattern(regexp="[^\\s@]+@[^\\s@]+\\.[^\\s@]+") @Size(max=254) String email,@NotBlank @Pattern(regexp="ADMIN|CLIENTE|VENDEDOR") String role,Boolean blocked,String password) {}
 public record Quantity(@NotNull @Min(0) Integer quantity) {}
 public record Amount(@NotNull @DecimalMin("0.01") @DecimalMax("100000") @Digits(integer=6,fraction=2) BigDecimal amount) {}
 public record Checkout(@NotBlank @Size(max=80) String requestKey) {}
}
