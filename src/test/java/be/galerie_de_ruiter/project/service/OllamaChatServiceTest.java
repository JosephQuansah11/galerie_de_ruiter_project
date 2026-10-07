package be.galerie_de_ruiter.project.service;

import static org.assertj.core.api.Assertions.assertThat;

import be.galerie_de_ruiter.project.domain.Category;
import java.util.List;
import org.junit.jupiter.api.Test;

class OllamaChatServiceTest {
    @Test
    void categoryContextIncludesExactVisibleCountAndNamesOnly() {
        Category antiques = new Category("Antiques", null, true);
        Category art = new Category("Art", null, true);
        Category hidden = new Category("Internal", null, false);

        assertThat(OllamaChatService.describeCategories(List.of(antiques, art, hidden)))
                .isEqualTo("There are 2 visible categories: Antiques, Art.");
    }

    @Test
    void categoryContextReportsWhenNoVisibleCategoriesExist() {
        assertThat(OllamaChatService.describeCategories(List.of(new Category("Hidden", null, false))))
                .isEqualTo("There are 0 visible categories.");
    }
}
