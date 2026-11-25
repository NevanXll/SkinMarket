package cl.skinmarket.usuarios;
import cl.skinmarket.common.repository.*;
import cl.skinmarket.common.dto.Requests;
import cl.skinmarket.usuarios.service.AuthService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.MediaType;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:auth;MODE=MySQL;DB_CLOSE_DELAY=-1","spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=","spring.flyway.enabled=false","spring.jpa.hibernate.ddl-auto=create-drop","app.jwt-secret=integration-test-secret-32-characters-minimum"})
@AutoConfigureMockMvc
class AuthIntegrationTest {
 @Autowired MockMvc mvc; @Autowired AuthService auth; @Autowired AccountRepository accounts; @Autowired RefreshRepository sessions; @Autowired PasswordEncoder passwords;
 @Autowired SellerApplicationRepository applications;
 @BeforeEach void clean(){applications.deleteAll();sessions.deleteAll();accounts.deleteAll();}
 @Test void registerHashesPasswordAndNeverReturnsIt() throws Exception {
  mvc.perform(post("/api/v1/auth/register").header("X-Requested-With","SkinMarket").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Cliente\",\"email\":\"client@example.com\",\"password\":\"Secret123\"}"))
   .andExpect(status().isCreated()).andExpect(jsonPath("$.user.role").value("CLIENTE")).andExpect(jsonPath("$.user.password").doesNotExist()).andExpect(jsonPath("$.accessToken").isString());
  var a=accounts.findByEmail("client@example.com").orElseThrow();assertNotEquals("Secret123",a.passwordHash);assertTrue(passwords.matches("Secret123",a.passwordHash));
 }
 @Test void rejectsInvalidEmail() throws Exception {mvc.perform(post("/api/v1/auth/register").header("X-Requested-With","SkinMarket").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Cliente\",\"email\":\"invalid\",\"password\":\"Secret123\"}")).andExpect(status().isBadRequest());}
 @Test void duplicateEmailIsConflict(){auth.register(new Requests.Register("Cliente","a@example.com","Secret123"));assertThrows(RuntimeException.class,()->auth.register(new Requests.Register("Cliente","a@example.com","Secret123")));}
 @Test void loginRejectsWrongPassword(){auth.register(new Requests.Register("Cliente","a@example.com","Secret123"));assertThrows(RuntimeException.class,()->auth.login(new Requests.Login("a@example.com","Wrong123")));}
 @Test void refreshRotatesAndRejectsOldToken(){var s=auth.register(new Requests.Register("Cliente","a@example.com","Secret123"));var next=auth.refresh(s.refresh());assertNotEquals(s.refresh(),next.refresh());assertThrows(RuntimeException.class,()->auth.refresh(s.refresh()));}
 @Test void logoutRevokesRefresh(){var s=auth.register(new Requests.Register("Cliente","a@example.com","Secret123"));auth.logout(s.refresh());assertThrows(RuntimeException.class,()->auth.refresh(s.refresh()));}
 @Test void anonymousCannotReadUsers() throws Exception {mvc.perform(get("/api/v1/admin/users")).andExpect(status().isUnauthorized());}
 @Test void anonymousCanOpenSwaggerAndItsConfiguration() throws Exception {
  mvc.perform(get("/api/v1/usuarios/swagger-ui.html"))
   .andExpect(status().is3xxRedirection())
   .andExpect(redirectedUrl("/api/v1/usuarios/swagger-ui/index.html"));
  mvc.perform(get("/api/v1/usuarios/swagger-ui/index.html")).andExpect(status().isOk());
  mvc.perform(get("/api/v1/usuarios/openapi/swagger-config")).andExpect(status().isOk());
 }
 @Test void clientCannotReadUsers() throws Exception {var s=auth.register(new Requests.Register("Cliente","a@example.com","Secret123"));mvc.perform(get("/api/v1/admin/users").header("Authorization","Bearer "+s.body().get("accessToken"))).andExpect(status().isForbidden());}
 @Test void missingCsrfHeaderIsRejected() throws Exception {mvc.perform(post("/api/v1/auth/refresh")).andExpect(status().isForbidden());}
 @Test void foreignOriginIsRejected() throws Exception {mvc.perform(post("/api/v1/auth/refresh").header("X-Requested-With","SkinMarket").header("Origin","https://attacker.example")).andExpect(status().isForbidden());}
 @Test void blockedAccountRevokesExistingAccess() throws Exception {var s=auth.register(new Requests.Register("Cliente","a@example.com","Secret123"));var a=accounts.findByEmail("a@example.com").orElseThrow();a.blocked=true;accounts.saveAndFlush(a);mvc.perform(get("/api/v1/me").header("Authorization","Bearer "+s.body().get("accessToken"))).andExpect(status().isUnauthorized());}
 @Test void passwordLimitIsUtf8Bytes(){assertThrows(RuntimeException.class,()->AuthService.checkPassword("ñ".repeat(37)));}
 @Test void profileChangesArePrivateAndCannotChangeRole() throws Exception {
  var applicant=auth.register(new Requests.Register("Cliente","profile@example.com","Secret123"));
  String token="Bearer "+applicant.body().get("accessToken");
  String profile="""
    {"name":"Perfil personalizado","avatar":"shield","bio":"Coleccionista",
     "showEmail":true,"showHeaderBalance":false,"role":"ADMIN"}
    """;
  mvc.perform(put("/api/v1/me/profile").contentType(MediaType.APPLICATION_JSON).content(profile))
   .andExpect(status().isUnauthorized());
  mvc.perform(put("/api/v1/me/profile").header("Authorization",token).contentType(MediaType.APPLICATION_JSON).content(profile.replace("shield","invalid")))
   .andExpect(status().isBadRequest());
  mvc.perform(put("/api/v1/me/profile").header("Authorization",token).contentType(MediaType.APPLICATION_JSON).content(profile))
   .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("CLIENTE"));
  mvc.perform(get("/api/v1/me").header("Authorization",token))
   .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Perfil personalizado"))
   .andExpect(jsonPath("$.avatar").value("shield")).andExpect(jsonPath("$.bio").value("Coleccionista"))
   .andExpect(jsonPath("$.showEmail").value(true)).andExpect(jsonPath("$.showHeaderBalance").value(false));
 }
 @Test void sellerApplicationRequiresAdminApprovalAndUpdatesCurrentSession() throws Exception {
  var applicant=auth.register(new Requests.Register("Cliente","seller@example.com","Secret123"));
  var account=accounts.findByEmail("seller@example.com").orElseThrow();
  var reviewer=auth.register(new Requests.Register("Administrador","reviewer@example.com","Secret123"));
  var admin=accounts.findByEmail("reviewer@example.com").orElseThrow();
  admin.role="ADMIN"; accounts.saveAndFlush(admin);
  String clientToken="Bearer "+applicant.body().get("accessToken");
  String adminToken="Bearer "+reviewer.body().get("accessToken");
  String form="{\"reason\":\"Quiero obtener acceso al panel de vendedor.\"}";
  String decision="{\"approved\":true}";
  var url="/api/v1/admin/seller-applications/"+account.id;

  mvc.perform(get("/api/v1/seller-application").header("Authorization",clientToken)).andExpect(status().isNoContent());
  mvc.perform(post("/api/v1/seller-application").header("Authorization",clientToken).contentType(MediaType.APPLICATION_JSON).content(form))
   .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("PENDIENTE"))
   .andExpect(jsonPath("$.skins").doesNotExist());
  mvc.perform(post("/api/v1/seller-application").header("Authorization",clientToken).contentType(MediaType.APPLICATION_JSON).content(form))
   .andExpect(status().isConflict());
  mvc.perform(put(url).header("Authorization",clientToken).contentType(MediaType.APPLICATION_JSON).content(decision))
   .andExpect(status().isForbidden());
  mvc.perform(put(url).header("Authorization",adminToken).contentType(MediaType.APPLICATION_JSON).content(decision))
   .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APROBADA"));
  mvc.perform(get("/api/v1/me").header("Authorization",clientToken))
   .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("VENDEDOR"));
  mvc.perform(get("/api/v1/admin/users").header("Authorization",clientToken)).andExpect(status().isForbidden());
  mvc.perform(post("/api/v1/orders").header("Authorization",clientToken)).andExpect(status().isForbidden());
 }
}
