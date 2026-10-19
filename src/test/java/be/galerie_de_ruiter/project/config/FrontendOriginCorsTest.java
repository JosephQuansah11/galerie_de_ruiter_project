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
 * The gallery serves the same site on the domain it owns and, for now, on the free subdomain it
 * used before it. Both are browser origins that call this API, so both have to survive the CORS
 * preflight - and a third origin still has to be refused.
 *
 * `FRONTEND_ORIGIN` is one comma-separated value rather than a list in YAML, because a Render
 * blueprint environment variable is a string. The space after the comma is deliberate: it is what
 * a person writes, and the parser trims it.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test-dev")
@TestPropertySource(properties =
        "FRONTEND_ORIGIN=https://galeriederuiterantieks.gripe, https://galeriederuiter.cloud-ip.cc")
class FrontendOriginCorsTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void answersThePreflightForBothOfTheGalleryOrigins() throws Exception {
        for (String origin : List.of(
                "https://galeriederuiterantieks.gripe",
                "https://galeriederuiter.cloud-ip.cc")) {
            mvc.perform(options("/api/location")
                            .header(HttpHeaders.ORIGIN, origin)
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                    .andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin));
        }
    }

    @Test
    void refusesAnOriginTheGalleryDoesNotServe() throws Exception {
        mvc.perform(options("/api/location")
                        .header(HttpHeaders.ORIGIN, "https://example.com")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isForbidden());
    }
}
