package be.galerie_de_ruiter.project.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueModel;
import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.repository.AntiqueModelRepository;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.DesignerRepository;
import be.galerie_de_ruiter.project.repository.UserRepository;
import be.galerie_de_ruiter.project.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
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
 * A .glb travels as multipart into a {@code bytea} column. This walks that whole path on a
 * clean database, so when an upload fails in production the environment (database capacity,
 * storage, instance memory) can be ruled in and the code ruled out.
 */
@SpringBootTest(properties = "spring.jpa.open-in-view=false")
@AutoConfigureMockMvc
@ActiveProfiles("test-dev")
class AntiqueModelUploadTest {
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
    private AntiqueModelRepository models;

    @MockitoBean
    private UserService users;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void adminCanUploadAndDownloadAGlbModel() throws Exception {
        UUID id = createAntique();

        byte[] modelBytes = minimalGlb();
        MockMultipartFile model = new MockMultipartFile("model", "figurine.glb", "model/gltf-binary", modelBytes);

        mvc.perform(multipart("/api/antiques/" + id + "/model")
                        .file(model)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modelUrl").value("/api/antiques/" + id + "/model"));

        mvc.perform(get("/api/antiques/" + id + "/model"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("model/gltf-binary"))
                .andExpect(content().bytes(modelBytes));

        // The bytes live on the gallery disk now: nothing was written to the database.
        assertThat(models.findByAntiqueId(id)).isEmpty();
    }

    @Test
    void stillServesAModelThatIsStoredInTheDatabase() throws Exception {
        UUID id = createAntique();
        byte[] legacyBytes = minimalGlb();
        Antique antique = antiques.findById(id).orElseThrow();
        models.save(new AntiqueModel(antique, legacyBytes));

        mvc.perform(get("/api/antiques/" + id + "/model"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(legacyBytes));
    }

    @Test
    void rejectsAFileThatIsNotAGlb() throws Exception {
        UUID id = createAntique();
        MockMultipartFile model = new MockMultipartFile("model", "figurine.glb", "model/gltf-binary",
                "this is not a glb".getBytes(StandardCharsets.UTF_8));

        mvc.perform(multipart("/api/antiques/" + id + "/model")
                        .file(model)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isBadRequest());
    }

    private UUID createAntique() throws Exception {
        Designer artist = designers.save(new Designer("Model", null, "Artist"));
        User creator = usersRepository.save(new User("model-subject", "model@example.com", "Admin"));
        when(users.findOrCreate(anyString(), nullable(String.class), nullable(String.class))).thenReturn(creator);

        MvcResult created = mvc.perform(post("/api/antiques")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Model upload","artistId":"%s","price":10}
                                """.formatted(artist.getId())))
                .andExpect(status().isOk())
                .andReturn();

        return UUID.fromString(JSON.readTree(created.getResponse().getContentAsString()).path("id").asText());
    }

    /** A structurally valid GLB 2.0 with an empty scene, which is all the API validates. */
    private static byte[] minimalGlb() {
        byte[] json = "{\"asset\":{\"version\":\"2.0\"},\"scene\":0,\"scenes\":[{\"nodes\":[]}]}"
                .getBytes(StandardCharsets.UTF_8);
        int paddedJsonLength = (json.length + 3) & ~3;
        ByteBuffer glb = ByteBuffer.allocate(12 + 8 + paddedJsonLength).order(ByteOrder.LITTLE_ENDIAN);
        glb.putInt(0x46546c67);
        glb.putInt(2);
        glb.putInt(glb.capacity());
        glb.putInt(paddedJsonLength);
        glb.putInt(0x4e4f534a);
        glb.put(json);
        while (glb.position() < glb.capacity()) glb.put((byte) ' ');
        return glb.array();
    }
}
