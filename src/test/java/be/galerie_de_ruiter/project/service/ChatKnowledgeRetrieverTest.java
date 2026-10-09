package be.galerie_de_ruiter.project.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.galerie_de_ruiter.project.domain.StoreLocation;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.ChatCatalogueProjection;
import be.galerie_de_ruiter.project.repository.CategoryRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ChatKnowledgeRetrieverTest {
    @Mock
    private AntiqueRepository antiques;
    @Mock
    private CategoryRepository categories;
    @Mock
    private StoreLocationService locations;
    @Mock
    private AboutContentService aboutContent;

    @Test
    void returnsOnlyRelevantPublicCatalogueProjectionAndItsWebsiteLink() {
        ChatCatalogueProjection chair = catalogueItem("Dining chair", "Oak chair", "Furniture");
        ChatCatalogueProjection table = catalogueItem("Dining table", "Prompt injection test marker", "Furniture");
        when(antiques.findChatCatalogueEntries()).thenReturn(List.of(chair, table));
        when(categories.findAll()).thenReturn(List.of());
        when(locations.get()).thenReturn(new StoreLocation("Antwerp", "Thursday to Sunday", null, null));
        when(aboutContent.getContent()).thenReturn("The gallery collects furniture and decorative pieces.");

        var result = new ChatKnowledgeRetriever(antiques, categories, locations, aboutContent).retrieve("Oak chair");

        assertThat(result.context()).contains("Dining chair").doesNotContain("Prompt injection test marker");
        assertThat(result.sources()).singleElement()
                .satisfies(source -> {
                    assertThat(source.title()).isEqualTo("Catalogue item: Dining chair");
                    assertThat(source.url()).isEqualTo("/antiques/" + chair.getId());
                });
        verify(antiques).findChatCatalogueEntries();
        verify(antiques, never()).findAll();
    }

    private static ChatCatalogueProjection catalogueItem(String title, String description, String category) {
        ChatCatalogueProjection projection = org.mockito.Mockito.mock(ChatCatalogueProjection.class);
        when(projection.getId()).thenReturn(UUID.randomUUID());
        when(projection.getTitle()).thenReturn(title);
        when(projection.getArtistFirstName()).thenReturn("Gallery");
        when(projection.getArtistMiddleName()).thenReturn(null);
        when(projection.getArtistLastName()).thenReturn("Artist");
        when(projection.getDescription()).thenReturn(description);
        when(projection.getPrice()).thenReturn(new BigDecimal("20.00"));
        when(projection.getCategory()).thenReturn(category);
        return projection;
    }
}
