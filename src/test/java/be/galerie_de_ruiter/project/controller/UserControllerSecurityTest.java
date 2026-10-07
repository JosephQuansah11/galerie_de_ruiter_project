package be.galerie_de_ruiter.project.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import be.galerie_de_ruiter.project.service.UserService;
import be.galerie_de_ruiter.project.service.OllamaChatService;
import be.galerie_de_ruiter.project.dto.ChatRequest;
import be.galerie_de_ruiter.project.dto.ChatResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test-dev")
class UserControllerSecurityTest {
    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private UserService users;

    @MockitoBean
    private OllamaChatService chat;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void unauthenticatedRequestsAreRejected() throws Exception {
        mvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void regularUsersCannotAccessAdminEndpoints() throws Exception {
        mvc.perform(get("/api/admin/users")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER")
                        )))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminsCanAccessAdminEndpoints() throws Exception {
        mvc.perform(get("/api/admin/users")
                        .with(jwt().authorities(
                                new SimpleGrantedAuthority("ROLE_ADMIN")
                        )))
                .andExpect(status().isOk());
    }

    @Test
    void chatIsAvailableWithoutAuthentication() throws Exception {
        when(chat.reply(any(ChatRequest.class), isNull()))
                .thenReturn(new ChatResponse("Hello", null, null, false));

        mvc.perform(post("/api/chat")
                        .contentType("application/json")
                        .content("{\"message\":\"Hello\",\"history\":[]}"))
                .andExpect(status().isOk());
    }
}