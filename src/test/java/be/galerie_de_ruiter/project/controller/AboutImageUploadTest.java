package be.galerie_de_ruiter.project.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * The About page story can carry photographs. This walks the upload-then-serve path so an
 * image the gallery inserts into the page is really reachable by every visitor.
 */
@SpringBootTest(properties = "spring.jpa.open-in-view=false")
@AutoConfigureMockMvc
@ActiveProfiles("test-dev")
class AboutImageUploadTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    /** A PNG signature, which is all the upload validation looks at. */
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0};

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void anAdminCanUploadAndEveryVisitorCanReadTheImage() throws Exception {
        MockMultipartFile file = new MockMultipartFile("image", "story.png", "image/png", PNG);

        MvcResult uploaded = mvc.perform(multipart("/api/about/images")
                        .file(file)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").isNotEmpty())
                .andReturn();

        String url = JSON.readTree(uploaded.getResponse().getContentAsString()).path("url").asText();
        mvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "public, max-age=31536000, immutable"))
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(PNG));
    }

    @Test
    void refusesAFileThatIsNotAnImage() throws Exception {
        MockMultipartFile file = new MockMultipartFile("image", "notes.txt", "text/plain",
                "this is not an image".getBytes(StandardCharsets.UTF_8));

        mvc.perform(multipart("/api/about/images")
                        .file(file)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .with(csrf()))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void onlyAnAdministratorCanUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile("image", "story.png", "image/png", PNG);

        mvc.perform(multipart("/api/about/images")
                        .file(file)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER")))
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }
}
