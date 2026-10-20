package be.galerie_de_ruiter.project.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * The API answers CORS preflights for the browser origins in `FRONTEND_ORIGIN`, and refuses every
 * other origin - including the gallery's retired free host, so it cannot start working again by
 * accident.
 *
 * `FRONTEND_ORIGIN` is one comma-separated value rather than a list in YAML, because a Render
 * blueprint environment variable is a string. The space after the comma is deliberate: it is what
 * a person writes, and the parser trims it. Production names the gallery's own domain; the second
 * origin here is a staging host that exercises the list without being a gallery address.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test-dev")
@TestPropertySource(properties =
        "FRONTEND_ORIGIN=https://galeriederuiterantieks.gripe, https://staging.galeriederuiterantieks.gripe")
class FrontendOriginCorsTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void answersThePreflightForEveryConfiguredGalleryOrigin() throws Exception {
        for (String origin : List.of(
                "https://galeriederuiterantieks.gripe",
                "https://staging.galeriederuiterantieks.gripe")) {
            mvc.perform(options("/api/location")
                            .header(HttpHeaders.ORIGIN, origin)
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                    .andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin));
        }
    }

    @Test
    void refusesTheRetiredFreeHostname() throws Exception {
        mvc.perform(options("/api/location")
                        .header(HttpHeaders.ORIGIN, "https://galeriederuiter.cloud-ip.cc")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isForbidden());
    }

    @Test
    void refusesAnOriginTheGalleryDoesNotServe() throws Exception {
        mvc.perform(options("/api/location")
                        .header(HttpHeaders.ORIGIN, "https://example.com")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isForbidden());
    }
}
