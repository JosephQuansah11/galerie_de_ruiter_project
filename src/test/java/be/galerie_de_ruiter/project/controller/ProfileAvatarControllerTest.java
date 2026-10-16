package be.galerie_de_ruiter.project.controller;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.service.UserService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * "No avatar yet" is an answer, not an error.
 *
 * The account menu falls back to the visitor's initials, so the app asks for the picture on every
 * page load and shows what it gets. Answering 404 meant the browser reported a failed request in the
 * console for every signed-in visitor who had not uploaded one - which reads as something being
 * broken, and was the only thing the gallery could see in that console. 204 says the same thing
 * without the failure, and the frontend reads both (see loadProfileAvatar).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test-dev")
class ProfileAvatarControllerTest {
    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private UserService users;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void aVisitorWithoutAnAvatarIsAnsweredWithNoContent() throws Exception {
        when(users.getByKeycloakSubject("no-avatar"))
                .thenReturn(new User("no-avatar", "visitor@example.com", "Visitor"));

        mvc.perform(get("/api/me/avatar").with(jwt().jwt(builder -> builder.claim("sub", "no-avatar"))))
                .andExpect(status().isNoContent());
    }

    @Test
    void aVisitorWhoHasOneIsAnsweredWithThePicture() throws Exception {
        User withAvatar = new User("has-avatar", "visitor@example.com", "Visitor");
        withAvatar.setAvatarImage(new byte[] { 1, 2, 3 });
        withAvatar.setAvatarContentType("image/png");
        when(users.getByKeycloakSubject("has-avatar")).thenReturn(withAvatar);

        mvc.perform(get("/api/me/avatar").with(jwt().jwt(builder -> builder.claim("sub", "has-avatar"))))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(new byte[] { 1, 2, 3 }));
    }

    @Test
    void aVisitorTheApiDoesNotKnowYetIsAnsweredWithNoContent() throws Exception {
        // The row is created on the first profile save or avatar upload, so a signed-in visitor can
        // reach this endpoint before it exists. That is not an error either.
        when(users.getByKeycloakSubject("unknown")).thenReturn(null);

        mvc.perform(get("/api/me/avatar").with(jwt().jwt(builder -> builder.claim("sub", "unknown"))))
                .andExpect(status().isNoContent());
    }

    @Test
    void anAnonymousRequestIsRejected() throws Exception {
        mvc.perform(get("/api/me/avatar"))
                .andExpect(status().isUnauthorized());
    }
}
