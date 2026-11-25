package cl.skinmarket.common.security;

import cl.skinmarket.common.repository.AccountRepository;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration @EnableMethodSecurity
public class SecurityConfig {
 @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
 @Bean SecretKeySpec signingKey(@Value("${app.jwt-secret}") String secret) {
  if(secret.getBytes(StandardCharsets.UTF_8).length<32) throw new IllegalStateException("JWT_SECRET debe tener al menos 32 bytes.");
  return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),"HmacSHA256");
 }
 @Bean JwtDecoder jwtDecoder(SecretKeySpec key) {
  var decoder=NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
  decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer("skinmarket")); return decoder;
 }
 @Bean JwtEncoder jwtEncoder(SecretKeySpec key) { return new NimbusJwtEncoder(new ImmutableSecret<>(key)); }
 @Bean CorsConfigurationSource cors(@Value("${app.cors-origins}") String origins) {
  var configuration=new CorsConfiguration(); configuration.setAllowedOrigins(Arrays.asList(origins.split(",")));
  configuration.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
  configuration.setAllowedHeaders(List.of("Authorization","Content-Type","X-Requested-With"));
  configuration.setAllowCredentials(true); configuration.setMaxAge(3600L);
  var source=new UrlBasedCorsConfigurationSource(); source.registerCorsConfiguration("/**",configuration); return source;
 }
 @Bean SecurityFilterChain security(HttpSecurity http,AccountRepository accounts, @Value("${app.cors-origins}") String origins) throws Exception {
  // Solo refresh usa cookie. Requiere cabecera no simple y origen permitido; los otros endpoints usan Bearer.
  var allowed=new HashSet<>(Arrays.asList(origins.split(",")));
  var authCsrf=new OncePerRequestFilter() {
   @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain) throws ServletException,IOException {
    if(req.getRequestURI().startsWith("/api/v1/auth/") && !List.of("GET","HEAD","OPTIONS").contains(req.getMethod())) {
     String origin=req.getHeader("Origin");
     if(!"SkinMarket".equals(req.getHeader("X-Requested-With")) || (origin!=null&&!allowed.contains(origin))) {
      res.setStatus(403); res.setContentType("application/json");res.setCharacterEncoding("UTF-8"); res.getWriter().write("{\"message\":\"Origen o cabecera de seguridad inválidos.\"}"); return;
     }
    }
    chain.doFilter(req,res);
   }
  };
  http.cors(c->{}).csrf(c->c.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   .addFilterBefore(authCsrf,UsernamePasswordAuthenticationFilter.class)
   .authorizeHttpRequests(a->a
    .requestMatchers(HttpMethod.OPTIONS,"/**").permitAll()
    .requestMatchers("/actuator/health","/api/v1/*/openapi/**","/api/v1/*/swagger-ui.html","/api/v1/*/swagger-ui/**","/swagger-ui/**").permitAll()
    .requestMatchers(HttpMethod.POST,"/api/v1/auth/login","/api/v1/auth/register","/api/v1/auth/refresh","/api/v1/auth/logout").permitAll()
    .requestMatchers(HttpMethod.GET,"/api/v1/products","/api/v1/products/*").permitAll()
    .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
    .requestMatchers(HttpMethod.GET,"/api/v1/seller/orders","/api/v1/seller/orders/*").hasAnyRole("ADMIN","VENDEDOR")
    .requestMatchers("/api/v1/cart/**","/api/v1/orders/**","/api/v1/inventory","/api/v1/wallet/**").hasAnyRole("ADMIN","CLIENTE")
    .requestMatchers(HttpMethod.POST,"/api/v1/products").hasRole("ADMIN")
    .requestMatchers(HttpMethod.PUT,"/api/v1/products/*").hasRole("ADMIN")
    .requestMatchers(HttpMethod.DELETE,"/api/v1/products/*").hasRole("ADMIN")
    .anyRequest().authenticated())
   .oauth2ResourceServer(o->o.jwt(j->j.jwtAuthenticationConverter(jwt->{
    var user=accounts.findById(jwt.getSubject()).orElseThrow(()->new BadCredentialsException("Sesión inválida"));
    Number version=jwt.getClaim("ver");
    if(user.blocked||version==null||version.longValue()!=user.authVersion) throw new BadCredentialsException("Sesión revocada");
    return new JwtAuthenticationToken(jwt,List.of(new SimpleGrantedAuthority("ROLE_"+user.role)),user.id);
   })))
   .exceptionHandling(e->e.authenticationEntryPoint((req,res,ex)->{res.setStatus(401);res.setContentType("application/json");res.setCharacterEncoding("UTF-8");res.getWriter().write("{\"message\":\"Inicia sesión para continuar.\"}");})
    .accessDeniedHandler((req,res,ex)->{res.setStatus(403);res.setContentType("application/json");res.setCharacterEncoding("UTF-8");res.getWriter().write("{\"message\":\"No tienes permiso para acceder a este recurso.\"}");}));
  return http.build();
 }
}
