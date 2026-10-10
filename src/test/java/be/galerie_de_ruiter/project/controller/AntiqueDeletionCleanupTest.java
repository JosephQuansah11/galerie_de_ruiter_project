package be.galerie_de_ruiter.project.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.repository.AntiqueLikeRepository;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.AntiqueViewRepository;
import be.galerie_de_ruiter.project.repository.DesignerRepository;
import be.galerie_de_ruiter.project.repository.UserRepository;
import be.galerie_de_ruiter.project.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * The public counters keep one row per visitor, separate from the antique itself. Deleting a
 * piece must take those rows with it: otherwise they stay behind pointing at a piece that no
 * longer exists, and a schema that carries the foreign key rejects the delete outright.
 */
@SpringBootTest(properties = "spring.jpa.open-in-view=false")
@AutoConfigureMockMvc
@ActiveProfiles("test-dev")
class AntiqueDeletionCleanupTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String VISITOR_KEY = "guest:deletion-test";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private DesignerRepository designers;

    @Autowired
    private UserRepository usersRepository;

    @Autowired
    private AntiqueRepository antiques;

    @Autowired
    private AntiqueLikeRepository likes;

    @Autowired
    private AntiqueViewRepository views;

    @MockitoBean
    private UserService users;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void deletingAnAntiqueRemovesItsLikesAndViews() throws Exception {
        Designer artist = designers.save(new Designer("Cleanup", null, "Artist"));
        User creator = usersRepository.save(new User("cleanup-subject", "cleanup@example.com", "Admin"));
        when(users.findOrCreate(anyString(), nullable(String.class), nullable(String.class))).thenReturn(creator);

        MvcResult created = mvc.perform(post("/api/antiques")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Deletion cleanup","artistId":"%s","price":25}
                                """.formatted(artist.getId())))
                .andExpect(status().isOk())
                .andReturn();

        UUID id = UUID.fromString(JSON.readTree(created.getResponse().getContentAsString()).path("id").asText());

        // Anonymous visitors reach the public counters without a token.
        mvc.perform(post("/api/antiques/" + id + "/views").header("X-Visitor-Id", "deletion-test"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/antiques/" + id + "/likes").header("X-Visitor-Id", "deletion-test"))
                .andExpect(status().isOk());

        assertThat(views.existsByAntiqueIdAndViewerKey(id, VISITOR_KEY)).isTrue();
        assertThat(likes.existsByAntiqueIdAndViewerKey(id, VISITOR_KEY)).isTrue();

        mvc.perform(delete("/api/antiques/" + id)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        assertThat(antiques.findById(id)).isEmpty();
        assertThat(views.existsByAntiqueIdAndViewerKey(id, VISITOR_KEY)).isFalse();
        assertThat(likes.existsByAntiqueIdAndViewerKey(id, VISITOR_KEY)).isFalse();
    }
}
