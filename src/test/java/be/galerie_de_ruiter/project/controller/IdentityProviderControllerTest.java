package be.galerie_de_ruiter.project.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import be.galerie_de_ruiter.project.service.IdentityProviderService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * The sign-in page has to be able to ask this before anyone is signed in, so the endpoint is public
 * and answers with the realm's providers. A 401 here would leave the page with no answer at all, and
 * the Google button it then offers on a guess is the dead end this endpoint exists to remove.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test-dev")
class IdentityProviderControllerTest {
    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private IdentityProviderService identityProviders;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void listsTheRealmsProvidersWithoutAuthentication() throws Exception {
        when(identityProviders.enabledAliases()).thenReturn(List.of("google"));

        mvc.perform(get("/api/auth/providers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providers.length()").value(1))
                .andExpect(jsonPath("$.providers[0]").value("google"));
    }

    @Test
    void answersWithNothingWhenTheRealmOffersNoProvider() throws Exception {
        when(identityProviders.enabledAliases()).thenReturn(List.of());

        mvc.perform(get("/api/auth/providers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providers.length()").value(0));
    }
}
