package cl.skinmarket.common.exception;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.dao.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
@RestControllerAdvice
public class GlobalExceptionHandler {
 @ExceptionHandler(ApiException.class) ResponseEntity<?> api(ApiException e) {return ResponseEntity.status(e.status).body(Map.of("message",e.getMessage()));}
 @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<?> validation(MethodArgumentNotValidException e) {
  var fields=new LinkedHashMap<String,String>(); e.getBindingResult().getFieldErrors().forEach(f->fields.put(f.getField(),f.getDefaultMessage()));
  return ResponseEntity.badRequest().body(Map.of("message","Revisa los campos del formulario.","errors",fields));
 }
 @ExceptionHandler(HttpMessageNotReadableException.class) ResponseEntity<?> malformed(Exception e) {return ResponseEntity.badRequest().body(Map.of("message","JSON o tipos de datos inválidos."));}
 @ExceptionHandler({DataIntegrityViolationException.class,org.springframework.orm.ObjectOptimisticLockingFailureException.class,CannotAcquireLockException.class})
 ResponseEntity<?> conflict(Exception e) {return ResponseEntity.status(409).body(Map.of("message","Conflicto con los datos actuales. Actualiza e intenta nuevamente."));}
}
