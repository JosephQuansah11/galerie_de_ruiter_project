package be.galerie_de_ruiter.project.controller;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import be.galerie_de_ruiter.project.domain.Category;
import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.repository.CategoryRepository;
import be.galerie_de_ruiter.project.repository.DesignerRepository;
import be.galerie_de_ruiter.project.repository.UserRepository;
import be.galerie_de_ruiter.project.service.UserService;
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
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest(properties = "spring.jpa.open-in-view=false")
@AutoConfigureMockMvc
@ActiveProfiles("test-dev")
class AntiqueCreationResponseTest {
    @Autowired
    private MockMvc mvc;

    @Autowired
    private DesignerRepository designers;

    @Autowired
    private UserRepository usersRepository;

    @Autowired
    private CategoryRepository categories;

    @MockitoBean
    private UserService users;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void updateKeepsArtistAndCategoryWhenTheyAreOmittedAndChangesThemWhenTheyAreSent() throws Exception {
        Designer first = designers.save(new Designer("First", null, "Artist"));
        Designer second = designers.save(new Designer("Second", null, "Artist"));
        Category firstCategory = categories.save(new Category("Update mirrors", null, true));
        Category secondCategory = categories.save(new Category("Update lighting", null, true));
        User creator = usersRepository.save(new User("update-subject", "update@example.com", "Update Admin"));
        when(users.findOrCreate(anyString(), nullable(String.class), nullable(String.class))).thenReturn(creator);

        String created = mvc.perform(post("/api/antiques")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Before","artistId":"%s","categoryId":"%s","price":10,"description":"Original"}
                                """.formatted(first.getId(), firstCategory.getId())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String id = new ObjectMapper().readTree(created).get("id").asText();

        // The import sends only the fields it knows: the existing artist and category stay.
        mvc.perform(put("/api/antiques/" + id)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"After","description":"Changed"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(10))
                .andExpect(jsonPath("$.artist.id").value(first.getId().toString()))
                .andExpect(jsonPath("$.category").value("Update mirrors"));

        // A row that does supply them can correct both.
        mvc.perform(put("/api/antiques/" + id)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"After","price":20,"description":"Changed","artistId":"%s","categoryId":"%s"}
                                """.formatted(second.getId(), secondCategory.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.artist.id").value(second.getId().toString()))
                .andExpect(jsonPath("$.category").value("Update lighting"));

        // This test shares the database with the catalogue assertions below; do not leave a piece
        // behind that changes which row is first in GET /api/antiques.
        mvc.perform(delete("/api/antiques/" + id)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void adminCanCreateAntiqueAndMapResponseWithOpenInViewDisabled() throws Exception {
        Designer artist = designers.save(new Designer("Test", null, "Artist"));
        User creator = usersRepository.save(new User("test-subject", "test@example.com", "Test Admin"));
        when(users.findOrCreate(anyString(), nullable(String.class), nullable(String.class))).thenReturn(creator);

        mvc.perform(post("/api/antiques")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Production transaction test","artistId":"%s","price":10}
                                """.formatted(artist.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Production transaction test"))
                .andExpect(jsonPath("$.imageUrls").isArray())
                .andExpect(jsonPath("$.imageUrls").isEmpty());

        mvc.perform(get("/api/antiques"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Production transaction test"))
                .andExpect(jsonPath("$[0].imageUrls").isEmpty());
    }

    @Test
    void adminCanDeleteSeveralPiecesAtOnce() throws Exception {
        Designer artist = designers.save(new Designer("Batch", null, "Artist"));
        User creator = usersRepository.save(new User("batch-subject", "batch@example.com", "Batch Admin"));
        when(users.findOrCreate(anyString(), nullable(String.class), nullable(String.class))).thenReturn(creator);

        String first = createPiece(artist, "Batch piece one");
        String second = createPiece(artist, "Batch piece two");

        mvc.perform(post("/api/antiques/batch-delete")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ids\":[\"%s\",\"%s\"]}".formatted(first, second)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(2))
                .andExpect(jsonPath("$.missing").isEmpty());
    }

    @Test
    void aVisitorCanMarkAPieceAndTheAdminSeesWho() throws Exception {
        Designer artist = designers.save(new Designer("Interested", null, "Artist"));
        User visitor = usersRepository.save(new User("wishlist-subject", "visitor@example.com", "Wishlist Visitor"));
        User creator = usersRepository.save(new User("wishlist-admin", "admin@example.com", "Wishlist Admin"));
        when(users.findOrCreate(anyString(), nullable(String.class), nullable(String.class))).thenReturn(creator, visitor);

        String id = createPiece(artist, "Wishlist piece");

        mvc.perform(post("/api/wishlist/" + id)
                        .with(jwt().jwt((token) -> token.subject("wishlist-subject")))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/wishlist").with(jwt().jwt((token) -> token.subject("wishlist-subject"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id))
                .andExpect(jsonPath("$[0].title").value("Wishlist piece"));

        mvc.perform(get("/api/admin/interests")
                        .with(jwt().jwt((token) -> token.subject("wishlist-admin"))
                                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Wishlist piece"))
                .andExpect(jsonPath("$[0].people[0].email").value("visitor@example.com"));

        mvc.perform(delete("/api/wishlist/" + id)
                        .with(jwt().jwt((token) -> token.subject("wishlist-subject")))
                        .with(csrf()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/wishlist").with(jwt().jwt((token) -> token.subject("wishlist-subject"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mvc.perform(delete("/api/antiques/" + id)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    private String createPiece(Designer artist, String title) throws Exception {
        String created = mvc.perform(post("/api/antiques")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"%s\",\"artistId\":\"%s\",\"price\":10}".formatted(title, artist.getId())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return new ObjectMapper().readTree(created).get("id").asText();
    }
}
