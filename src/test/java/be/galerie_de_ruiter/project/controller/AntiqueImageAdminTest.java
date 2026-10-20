package be.galerie_de_ruiter.project.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueImage;
import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.repository.AntiqueImageRepository;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.DesignerRepository;
import be.galerie_de_ruiter.project.repository.UserRepository;
import be.galerie_de_ruiter.project.service.ImageFormats;
import be.galerie_de_ruiter.project.service.ThumbnailService;
import be.galerie_de_ruiter.project.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.UUID;
import javax.imageio.ImageIO;
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
 * Managing a piece's photographs: the gallery can add several, remove a wrong one, and put them
 * in its own order. This walks that whole path on a clean database.
 */
@SpringBootTest(properties = "spring.jpa.open-in-view=false")
@AutoConfigureMockMvc
@ActiveProfiles("test-dev")
class AntiqueImageAdminTest {
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

    @Test
    void theGalleryCanPutItsPhotographsInItsOwnOrder() throws Exception {
        UUID id = createAntique();
        UUID first = uploadImage(id, "first.jpg");
        UUID second = uploadImage(id, "second.jpg");
        UUID third = uploadImage(id, "third.jpg");

        mvc.perform(put("/api/antiques/" + id + "/image/order")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(JSON.writeValueAsString(java.util.Map.of("imageIds", List.of(third, first, second)))))
                .andExpect(status().isNoContent());

        // The list returns the photographs in the new order, so the first one is the main image.
        MvcResult listed = mvc.perform(get("/api/antiques")).andExpect(status().isOk()).andReturn();
        List<String> urls = new java.util.ArrayList<>();
        for (var node : JSON.readTree(listed.getResponse().getContentAsString())) {
            if (node.path("id").asText().equals(id.toString())) {
                node.path("imageUrls").forEach(url -> urls.add(url.asText()));
            }
        }

        assertThat(urls).containsExactly(
                "/api/antiques/" + id + "/image/" + third,
                "/api/antiques/" + id + "/image/" + first,
                "/api/antiques/" + id + "/image/" + second);
    }

    @Test
    void servesResponsiveCopiesAtTheirOwnWidthsAndCachesThem() throws Exception {
        UUID id = createAntique();
        UUID photo = uploadPhotograph(id, "wide.png", 2000, 1000);

        // The upload made all three copies, so a later request never has to read the original.
        assertThat(images.findThumbnail(photo, id)).isPresent();
        assertThat(images.findMedium(photo, id)).isPresent();
        assertThat(images.findLarge(photo, id)).isPresent();

        assertCopy(id, photo, "medium", ThumbnailService.MEDIUM_EDGE);
        assertCopy(id, photo, "large", ThumbnailService.LARGE_EDGE);
    }

    @Test
    void convertsAnOlderJpegToWebpAndRewritesItsCopies() throws Exception {
        assumeTrue(ImageFormats.canWriteWebp(), "this build has no WebP encoder");
        UUID id = createAntique();
        Antique antique = antiques.findById(id).orElseThrow();
        AntiqueImage older = images.save(new AntiqueImage(antique, "0", "0", jpeg(1200, 900), "image/jpeg"));

        mvc.perform(post("/api/admin/images/convert-to-webp")
                        .param("confirm", "true")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.converted").value(1))
                .andExpect(jsonPath("$.failed").isEmpty());

        AntiqueImage converted = images.findById(older.getId()).orElseThrow();
        assertThat(converted.getContentType()).isEqualTo("image/webp");
        assertThat(ImageFormats.sniff(converted.getData())).isEqualTo("image/webp");
        // The small copies made in the same pass are WebP too, not the old JPEGs.
        assertThat(ImageFormats.sniff(converted.getThumbnail())).isEqualTo("image/webp");
        assertThat(ImageFormats.sniff(converted.getMedium())).isEqualTo("image/webp");
        assertThat(ImageFormats.sniff(converted.getLarge())).isEqualTo("image/webp");
    }

    @Test
    void aDryRunOnlyCountsWhatIsLeftToConvert() throws Exception {
        UUID id = createAntique();
        Antique antique = antiques.findById(id).orElseThrow();
        images.save(new AntiqueImage(antique, "0", "0", jpeg(300, 200), "image/jpeg"));

        mvc.perform(post("/api/admin/images/convert-to-webp")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dryRun").value(true))
                .andExpect(jsonPath("$.candidates").isNumber());

        // Nothing was rewritten, so the row is still the JPEG it was.
        assertThat(images.findIdsNotWebp()).isNotEmpty();
    }

    private void assertCopy(UUID id, UUID imageId, String variant, int expectedEdge) throws Exception {
        mvc.perform(get("/api/antiques/" + id + "/image/" + imageId + "/" + variant))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "public, max-age=31536000, immutable"))
                // WebP is the stored format; a build without the encoder still answers with JPEG.
                .andDo(result -> {
                    assertThat(result.getResponse().getContentType()).isIn("image/webp", "image/jpeg");
                })
                .andDo(result -> {
                    BufferedImage copy = ImageIO.read(new ByteArrayInputStream(
                            result.getResponse().getContentAsByteArray()));
                    assertThat(Math.max(copy.getWidth(), copy.getHeight())).isEqualTo(expectedEdge);
                });
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

    /** Uploads one photograph and returns its id from the API's answer. */
    private UUID uploadImage(UUID antiqueId, String name) throws Exception {
        MockMultipartFile image = new MockMultipartFile("image", name, "image/jpeg", new byte[] {1, 2, 3});

        MvcResult uploaded = mvc.perform(multipart("/api/antiques/" + antiqueId + "/image")
                        .file(image)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andReturn();

        return UUID.fromString(JSON.readTree(uploaded.getResponse().getContentAsString()).path("id").asText());
    }

    /** A real, decodable JPEG, as the gallery stored photographs before the WebP encoder. */
    private static byte[] jpeg(int width, int height) throws Exception {
        BufferedImage source = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream jpeg = new ByteArrayOutputStream();
        ImageIO.write(source, "jpeg", jpeg);
        return jpeg.toByteArray();
    }

    /** Uploads a real, decodable PNG so the responsive copies can be measured. */
    private UUID uploadPhotograph(UUID antiqueId, String name, int width, int height) throws Exception {
        BufferedImage source = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream png = new ByteArrayOutputStream();
        ImageIO.write(source, "png", png);
        MockMultipartFile image = new MockMultipartFile("image", name, "image/png", png.toByteArray());

        MvcResult uploaded = mvc.perform(multipart("/api/antiques/" + antiqueId + "/image")
                        .file(image)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andReturn();

        return UUID.fromString(JSON.readTree(uploaded.getResponse().getContentAsString()).path("id").asText());
    }
}
