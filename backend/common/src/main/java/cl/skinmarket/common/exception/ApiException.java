package cl.skinmarket.common.exception;
import org.springframework.http.HttpStatus;
public class ApiException extends RuntimeException {
 public final HttpStatus status;
 public ApiException(HttpStatus status,String message) { super(message); this.status=status; }
 public static ApiException missing() { return new ApiException(HttpStatus.NOT_FOUND,"El recurso no existe."); }
 public static ApiException conflict(String message) { return new ApiException(HttpStatus.CONFLICT,message); }
 public static ApiException denied() { return new ApiException(HttpStatus.FORBIDDEN,"Acceso denegado."); }
}
