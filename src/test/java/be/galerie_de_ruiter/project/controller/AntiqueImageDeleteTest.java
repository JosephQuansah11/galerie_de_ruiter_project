package be.galerie_de_ruiter.project.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import be.galerie_de_ruiter.project.domain.AntiqueImage;
import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.repository.AntiqueImageRepository;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.DesignerRepository;
import be.galerie_de_ruiter.project.repository.UserRepository;
import be.galerie_de_ruiter.project.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * The gallery must be able to correct a wrong photograph on a piece without deleting and
 * recreating the whole antique. This walks the upload-then-remove path on a clean database.
 */
@SpringBootTest(properties = "spring.jpa.open-in-view=false")
@AutoConfigureMockMvc
@ActiveProfiles("test-dev")
class AntiqueImageDeleteTest {
    private static final ObjectMapper JSON = new ObjectMapper();

    @Autowired
    private MockMvc mvc;

    @Autowired
    private DesignerRepository designers;

    @Autowired
    private UserRepository usersRepository;

    @Autowired
    private AntiqueRepository antiques;

    @Autowired
    private AntiqueImageRepository images;

    @MockitoBean
    private UserService users;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void adminCanRemoveOnePhotographFromAPiece() throws Exception {
        UUID id = createAntique();
        UUID front = uploadImage(id, "front.jpg");
        UUID back = uploadImage(id, "back.jpg");

        mvc.perform(delete("/api/antiques/" + id + "/image/" + front)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        assertThat(images.findById(front)).isEmpty();
        assertThat(images.findById(back)).isPresent();
    }

    @Test
    void refusesAnImageThatBelongsToAnotherPiece() throws Exception {
        UUID id = createAntique();
        UUID other = createAntique();
        UUID image = uploadImage(other, "other.jpg");

        mvc.perform(delete("/api/antiques/" + id + "/image/" + image)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf()))
                .andExpect(status().isNotFound());

        assertThat(images.findById(image)).isPresent();
    }

    private UUID createAntique() throws Exception {
        Designer artist = designers.save(new Designer("Image", null, "Editor"));
        User creator = usersRepository.save(new User("image-subject", "image@example.com", "Admin"));
        when(users.findOrCreate(anyString(), nullable(String.class), nullable(String.class))).thenReturn(creator);

        MvcResult created = mvc.perform(post("/api/antiques")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Image edit","artistId":"%s","price":10}
                                """.formatted(artist.getId())))
                .andExpect(status().isOk())
                .andReturn();

        return UUID.fromString(JSON.readTree(created.getResponse().getContentAsString()).path("id").asText());
    }

    /** Uploads one photograph and returns its id (the image the API just appended). */
    private UUID uploadImage(UUID antiqueId, String name) throws Exception {
        Set<UUID> before = images.findAllByAntiqueId(antiqueId).stream()
                .map(AntiqueImage::getId)
                .collect(Collectors.toSet());
        MockMultipartFile image = new MockMultipartFile("image", name, "image/jpeg", new byte[] {1, 2, 3});

        mvc.perform(multipart("/api/antiques/" + antiqueId + "/image")
                        .file(image)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isNoContent());

        return images.findAllByAntiqueId(antiqueId).stream()
                .map(AntiqueImage::getId)
                .filter(imageId -> !before.contains(imageId))
                .findFirst()
                .orElseThrow();
    }
}
