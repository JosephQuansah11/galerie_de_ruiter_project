package be.galerie_de_ruiter.project.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueImage;
import be.galerie_de_ruiter.project.domain.Category;
import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.repository.AntiqueImageRepository;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.CategoryRepository;
import be.galerie_de_ruiter.project.repository.DesignerRepository;
import be.galerie_de_ruiter.project.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManagerFactory;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * The category list is drawn on every page, so it must count pieces without reading them.
 *
 * <p>The leak this guards against is not visible in a response: it is Hibernate loading every
 * Antique - and the legacy photograph column in each row - to answer {@code getAntiques().size()}
 * and {@code CategoryResponse.from}. The counts are now one query (see
 * {@code CategoryRepository.findAllWithCounts()}), and the test asserts that the request loaded no
 * entity at all. If someone maps the entity again, the load counter rises and this fails.</p>
 */
@SpringBootTest(properties = "spring.jpa.open-in-view=false")
@AutoConfigureMockMvc
@ActiveProfiles("test-dev")
class CategoryApiTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    /** Large enough that a leak of a few rows would show in a heap dump, small enough for H2. */
    private static final int PHOTO_BYTES = 500_000;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private CategoryRepository categories;

    @Autowired
    private AntiqueRepository antiques;

    @Autowired
    private AntiqueImageRepository images;

    @Autowired
    private DesignerRepository designers;

    @Autowired
    private UserRepository users;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Test
    void thePublicCategoryListCountsPiecesWithoutReadingThem() throws Exception {
        Category furniture = categories.save(new Category("Memory furniture", null, true));
        Category mirrors = categories.save(new Category("Memory mirrors", furniture, true));
        antiqueWithPhoto(furniture, "Memory cabinet");
        antiqueWithPhoto(furniture, "Memory chair");
        antiqueWithPhoto(mirrors, "Memory mirror");

        Statistics statistics = statistics();

        String body = mvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        JsonNode parent = categoryNamed(body, "Memory furniture");
        assertThat(parent.path("itemCount").asLong()).isEqualTo(2);
        JsonNode child = parent.path("children").get(0);
        assertThat(child.path("name").asText()).isEqualTo("Memory mirrors");
        assertThat(child.path("itemCount").asLong()).isEqualTo(1);

        // The count came from PostgreSQL. No Antique row - and so no image_data column - and no
        // AntiqueImage was loaded to answer a navigation request.
        assertThat(loadsOf(statistics, Antique.class)).isZero();
        assertThat(loadsOf(statistics, AntiqueImage.class)).isZero();
        assertThat(statistics.getCollectionLoadCount()).isZero();
    }

    @Test
    void theAdminCategoryListCountsTheSameWay() throws Exception {
        Category hidden = categories.save(new Category("Memory admin root", null, false));
        antiqueWithPhoto(hidden, "Memory hidden piece");

        Statistics statistics = statistics();

        mvc.perform(get("/api/categories/admin")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk());

        assertThat(loadsOf(statistics, Antique.class)).isZero();
        assertThat(loadsOf(statistics, AntiqueImage.class)).isZero();
        assertThat(statistics.getCollectionLoadCount()).isZero();
    }

    /** How many rows of one entity this request loaded, and so had to hold while it answered. */
    private static long loadsOf(Statistics statistics, Class<?> entity) {
        var entityStatistics = statistics.getEntityStatistics(entity.getName());
        return entityStatistics == null ? 0 : entityStatistics.getLoadCount();
    }

    /** Statistics start fresh for the request under test; the setup above is not counted. */
    private Statistics statistics() {
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        return statistics;
    }

    /** A piece with a legacy in-row photograph and one modern image row, both of real size. */
    private void antiqueWithPhoto(Category category, String title) {
        Designer artist = designers.save(new Designer("Memory", null, "Artist"));
        User creator = users.save(new User("memory-" + UUID.randomUUID(), "memory@example.com", "Memory"));
        Antique antique = new Antique(title, artist, "A piece", null, creator, category);
        antique.setImageData(new byte[PHOTO_BYTES]);
        Antique stored = antiques.save(antique);
        images.save(new AntiqueImage(stored, "0", "photo", new byte[PHOTO_BYTES], "image/jpeg"));
    }

    private static JsonNode categoryNamed(String body, String name) throws Exception {
        for (JsonNode category : JSON.readTree(body)) {
            if (name.equals(category.path("name").asText())) return category;
        }
        throw new AssertionError("Category not in the answer: " + name);
    }
}