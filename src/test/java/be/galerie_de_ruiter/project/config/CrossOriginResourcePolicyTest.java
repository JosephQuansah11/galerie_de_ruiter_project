package be.galerie_de_ruiter.project.config;

import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * The API is embedded from another origin, and it is the only service here that is: the gallery's
 * frontend is a static site on the gallery's own domain, and the photographs and 3D models are
 * served from this API. `Cross-Origin-Resource-Policy` is the header a page that sets
 * `Cross-Origin-Embedder-Policy: require-corp` consults before it renders such a resource, and a
 * resource that declares no policy is one that page refuses to load.
 *
 * The value has to be `cross-origin`. `same-origin` and `same-site` are both compared against the
 * page doing the embedding, and the gallery's frontend is a different host *and* a different site
 * from this service, so either of them would block the gallery's own catalogue. The cost of that
 * choice is stated where it belongs - another site may embed the gallery's images, which is also
 * what makes the gallery's photographs shareable.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test-dev")
class CrossOriginResourcePolicyTest {
    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void aPublicReadDeclaresWhatMayEmbedIt() throws Exception {
        mvc.perform(get("/api/location"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cross-Origin-Resource-Policy", "cross-origin"));
    }

    @Test
    void thePolicyIsNotOneThatWouldBlockTheGalleryItself() throws Exception {
        // Spelled out rather than left to the test above: `same-site` is the tempting value, because
        // it sounds like the stricter version of the same thing, and it is the one that would
        // silently break every photograph in the catalogue.
        mvc.perform(get("/api/location"))
                .andExpect(header().string("Cross-Origin-Resource-Policy", not("same-origin")))
                .andExpect(header().string("Cross-Origin-Resource-Policy", not("same-site")));
    }

    @Test
    void thePhotographsAndModelsCarryItToo() throws Exception {
        // These are the resources another page embeds. The header is set by the filter chain rather
        // than by a controller, so it is on the response whether the resource is there or not - an
        // image request for a piece that does not exist still answers with the policy.
        mvc.perform(get("/api/antiques/11111111-1111-1111-1111-111111111111/image"))
                .andExpect(header().string("Cross-Origin-Resource-Policy", "cross-origin"));
        mvc.perform(get("/api/antiques/11111111-1111-1111-1111-111111111111/model"))
                .andExpect(header().string("Cross-Origin-Resource-Policy", "cross-origin"));
    }
}
