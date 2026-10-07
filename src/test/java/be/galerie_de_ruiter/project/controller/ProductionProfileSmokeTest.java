package be.galerie_de_ruiter.project.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import jakarta.servlet.http.Cookie;
import be.galerie_de_ruiter.project.repository.AppointmentRepository;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "JPA_DDL_AUTO=create-drop",
        "keycloak.provision-admin.required=false",
        "keycloak.provision-admin.username=",
        "keycloak.provision-admin.password="
})
@AutoConfigureMockMvc
@ActiveProfiles("prod")
@EnabledIfEnvironmentVariable(named = "RUN_PRODUCTION_SMOKE", matches = "true")
class ProductionProfileSmokeTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final AtomicReference<String> ollamaSystemPrompt = new AtomicReference<>();
    private static final AtomicReference<String> ollamaModel = new AtomicReference<>();
    private static HttpServer ollama;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private AppointmentRepository appointments;

    @DynamicPropertySource
    static void productionProperties(DynamicPropertyRegistry properties) {
        properties.add("DATABASE_URL", () -> requiredEnv("PRODUCTION_TEST_DATABASE_URL"));
        properties.add("DATABASE_USERNAME", () -> requiredEnv("PRODUCTION_TEST_DATABASE_USERNAME"));
        properties.add("DATABASE_PASSWORD", () -> requiredEnv("PRODUCTION_TEST_DATABASE_PASSWORD"));
        properties.add("KEYCLOAK_ISSUER_URI", () -> "http://localhost:8082/realms/production-smoke");
        properties.add("KEYCLOAK_JWK_SET_URI", () -> "http://localhost:8082/realms/production-smoke/protocol/openid-connect/certs");
        properties.add("PUBLIC_KEYCLOAK_URL", () -> "http://localhost:8082");
        properties.add("KEYCLOAK_REALM", () -> "production-smoke");
        properties.add("KEYCLOAK_ADMIN_REALM", () -> "master");
        properties.add("KEYCLOAK_ADMIN_CLIENT_ID", () -> "admin-cli");
        properties.add("KEYCLOAK_ADMIN_USERNAME", () -> "smoke-admin");
        properties.add("KEYCLOAK_ADMIN_PASSWORD", () -> "smoke-password");
        properties.add("FRONTEND_ORIGIN", () -> "http://localhost:3000");
        properties.add("OLLAMA_BASE_URL", ProductionProfileSmokeTest::startOllamaStub);
        properties.add("OLLAMA_MODEL", () -> "smoke-model");
    }

    @AfterAll
    static void stopOllamaStub() {
        if (ollama != null) {
            ollama.stop(0);
            ollama = null;
        }
    }

    @Test
    void productionProfileSupportsPublicCatalogueAdminWritesImagesAndChat() throws Exception {
        var admin = jwt().jwt(token -> token.subject("production-smoke-admin")
                        .claim("preferred_username", "smoke-admin")
                        .claim("email", "smoke-admin@example.test"))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));

        mvc.perform(options("/api/antiques")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "authorization,content-type,x-xsrf-token"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string("Access-Control-Allow-Origin", "http://localhost:3000"));

        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        mvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(7));

        MvcResult csrfResponse = mvc.perform(get("/api/login"))
                .andExpect(status().isOk())
                .andReturn();
        String csrfToken = JSON.readTree(csrfResponse.getResponse().getContentAsString())
                .path("token").asText();
        Cookie csrfCookie = csrfResponse.getResponse().getCookie("XSRF-TOKEN");
        assertThat(csrfToken).isNotBlank();
        assertThat(csrfCookie).isNotNull();

        mvc.perform(get("/api/categories/admin"))
                .andExpect(status().isUnauthorized());
        MvcResult categoryCreated = mvc.perform(post("/api/categories")
                        .with(admin)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Production smoke category","visible":true}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Production smoke category"))
                .andReturn();
        String categoryId = JSON.readTree(categoryCreated.getResponse().getContentAsString())
                .path("id").asText();

        mvc.perform(put("/api/categories/" + categoryId)
                        .with(admin)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Production smoke category","visible":false}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visible").value(false));
        mvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(7));
        mvc.perform(delete("/api/categories/" + categoryId)
                        .with(admin)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfToken))
                .andExpect(status().isNoContent());

        MvcResult designerCreated = mvc.perform(post("/api/designers/add/designer")
                        .with(admin)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Smoke","lastName":"Artist"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andReturn();
        String artistId = JSON.readTree(designerCreated.getResponse().getContentAsString())
                .path("id").asText();

        MvcResult antiqueCreated = mvc.perform(post("/api/antiques")
                        .with(admin)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Production smoke antique","artistId":"%s","price":125.50}
                                """.formatted(artistId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Production smoke antique"))
                .andExpect(jsonPath("$.artist.firstName").value("Smoke"))
                .andExpect(jsonPath("$.imageUrls").isEmpty())
                .andReturn();
        String antiqueId = JSON.readTree(antiqueCreated.getResponse().getContentAsString())
                .path("id").asText();

        byte[] imageBytes = {1, 2, 3, 4};
        MockMultipartFile image = new MockMultipartFile("image", "smoke.png", "image/png", imageBytes);
        mvc.perform(multipart("/api/antiques/" + antiqueId + "/image")
                        .file(image)
                        .with(admin)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfToken)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/antiques"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Production smoke antique"))
                .andExpect(jsonPath("$[0].imageUrls.length()").value(1));
        mvc.perform(get("/api/antiques/" + antiqueId + "/image"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(imageBytes));

        mvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"How many categories are available?","history":[]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("There are 7 visible categories."));
        assertThat(ollamaModel).hasValue("smoke-model");
        assertThat(ollamaSystemPrompt.get())
                .contains("There are 7 visible categories:")
                .contains("Production smoke antique")
                .contains("Smoke Artist");

        String appointmentSubject = "production-smoke-visitor";
        mvc.perform(post("/api/chat")
                        .with(jwt().jwt(token -> token.subject(appointmentSubject)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"Please confirm an appointment for me","history":[]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentConfirmed").value(true))
                .andExpect(jsonPath("$.appointmentType").value("VISIT"));
        assertThat(appointments.existsByKeycloakSubjectAndStartsAtAndType(
                appointmentSubject, LocalDateTime.parse("2099-05-10T11:00:00"), "VISIT")).isTrue();

        mvc.perform(get("/api/categories/admin").with(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(7));
    }

    private static String requiredEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Set " + name + " to an isolated production-smoke PostgreSQL database.");
        }
        return value;
    }

    private static synchronized String startOllamaStub() {
        if (ollama == null) {
            try {
                ollama = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
                ollama.createContext("/api/chat", exchange -> {
                    try {
                        JsonNode request = JSON.readTree(exchange.getRequestBody());
                        ollamaModel.set(request.path("model").asText());
                        ollamaSystemPrompt.set(request.path("messages").path(0).path("content").asText());
                        boolean appointment = request.path("messages")
                                .path(request.path("messages").size() - 1)
                                .path("content").asText().contains("appointment");
                        Map<String, Object> modelReply = new java.util.LinkedHashMap<>();
                        modelReply.put("reply", appointment
                                ? "Your appointment is confirmed."
                                : "There are 7 visible categories.");
                        modelReply.put("appointmentAt", appointment ? "2099-05-10T11:00:00" : null);
                        modelReply.put("appointmentType", appointment ? "VISIT" : null);
                        modelReply.put("appointmentConfirmed", appointment);
                        String modelContent = JSON.writeValueAsString(modelReply);
                        byte[] response = JSON.writeValueAsBytes(Map.of(
                                "message", Map.of("content", modelContent)));
                        exchange.getResponseHeaders().set("Content-Type", "application/json");
                        exchange.sendResponseHeaders(200, response.length);
                        exchange.getResponseBody().write(response);
                    } catch (Exception exception) {
                        byte[] response = exception.getMessage().getBytes(StandardCharsets.UTF_8);
                        exchange.sendResponseHeaders(500, response.length);
                        exchange.getResponseBody().write(response);
                    } finally {
                        exchange.close();
                    }
                });
                ollama.start();
            } catch (IOException exception) {
                throw new IllegalStateException("Could not start the isolated Ollama test stub.", exception);
            }
        }
        return "http://127.0.0.1:" + ollama.getAddress().getPort();
    }
}
