package be.galerie_de_ruiter.project.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import be.galerie_de_ruiter.project.service.UserService;
import be.galerie_de_ruiter.project.service.OllamaChatService;
import be.galerie_de_ruiter.project.service.AntiqueService;
import be.galerie_de_ruiter.project.dto.ChatRequest;
import be.galerie_de_ruiter.project.dto.ChatResponse;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

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
    private AntiqueService antiques;

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

    @Test
    void visibleCategoriesLoadWithoutAuthentication() throws Exception {
        mvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").isString())
                .andExpect(jsonPath("$[0].itemCount").isNumber());
    }

    @Test
    void adminsCanLoadAllCategories() throws Exception {
        mvc.perform(get("/api/categories/admin")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").isString());
    }

    @Test
    void adminsCanCreateAndUpdateCategories() throws Exception {
        String created = mvc.perform(post("/api/categories")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Integration category\",\"visible\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(0))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String id = com.jayway.jsonpath.JsonPath.read(created, "$.id");

        mvc.perform(put("/api/categories/" + id)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Updated integration category\",\"visible\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated integration category"))
                .andExpect(jsonPath("$.itemCount").value(0));
    }

    @Test
    void adminsCanCreateAntiquesWithCsrf() throws Exception {
        String request = """
                {"title":"Test antique","artistId":"11111111-1111-1111-1111-111111111111","price":10}
                """;
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT))
                .when(antiques).createResponse(any(), any());
        mvc.perform(post("/api/antiques")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isConflict());
        verify(antiques).createResponse(any(), any());
    }
}