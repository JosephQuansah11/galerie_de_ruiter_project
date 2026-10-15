package be.galerie_de_ruiter.project.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.Category;
import be.galerie_de_ruiter.project.dto.GalleryStatsResponse;
import be.galerie_de_ruiter.project.dto.GalleryStatsResponse.CategoryStats;
import be.galerie_de_ruiter.project.dto.GalleryStatsResponse.DayCount;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.AntiqueViewRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * The dashboard's numbers are the gallery's own rows counted, so the tests pin the counting: what
 * is sold and on offer, per collection and subcategory, and the two time series.
 */
@ExtendWith(MockitoExtension.class)
class GalleryStatsServiceTest {
    private static final ZoneId ZONE = ZoneId.of("Europe/Brussels");

    @Mock
    private AntiqueRepository antiques;
    @Mock
    private AntiqueViewRepository views;

    @Test
    void countsTheCollectionAndWhatIsSold() {
        when(antiques.findAll()).thenReturn(List.of(
                antique("Mirror", null, false, 4),
                antique("Chair", null, true, 2),
                antique("Lamp", null, true, 0)));
        when(views.findCreatedAtSince(any())).thenReturn(List.of());

        GalleryStatsResponse stats = new GalleryStatsService(antiques, views).stats(7);

        assertThat(stats.totals().antiques()).isEqualTo(3);
        assertThat(stats.totals().sold()).isEqualTo(2);
        assertThat(stats.totals().available()).isEqualTo(1);
        assertThat(stats.totals().views()).isEqualTo(6);
    }

    @Test
    void breaksTheCollectionDownByCategoryAndSubcategory() {
        Category furniture = new Category("Furniture", null, true);
        Category mirrors = new Category("Mirrors", furniture, true);
        when(antiques.findAll()).thenReturn(List.of(
                antique("Cabinet", furniture, false, 1),
                antique("Chest", furniture, true, 1),
                antique("Gilt mirror", mirrors, false, 3)));
        when(views.findCreatedAtSince(any())).thenReturn(List.of());

        List<CategoryStats> rows = new GalleryStatsService(antiques, views).stats(7).categories();

        assertThat(rows).extracting(CategoryStats::name).containsExactly("Furniture", "Mirrors");
        CategoryStats parent = rows.get(0);
        assertThat(parent.parentName()).isNull();
        assertThat(parent.antiques()).isEqualTo(2);
        assertThat(parent.sold()).isEqualTo(1);
        assertThat(parent.available()).isEqualTo(1);
        CategoryStats child = rows.get(1);
        assertThat(child.parentName()).isEqualTo("Furniture");
        assertThat(child.views()).isEqualTo(3);
    }

    @Test
    void chartsDistinctViewsPerDayAcrossTheWindow() {
        Instant now = Instant.now();
        when(antiques.findAll()).thenReturn(List.of(antique("Mirror", null, false, 0)));
        when(views.findCreatedAtSince(any())).thenReturn(List.of(now, now, now.minusSeconds(86_400)));

        List<DayCount> series = new GalleryStatsService(antiques, views).stats(7).viewsPerDay();

        // A day without views is a zero, so the chart never has a gap in it.
        assertThat(series).hasSize(7);
        assertThat(series.get(6).day()).isEqualTo(LocalDate.now(ZONE));
        assertThat(series.get(6).count()).isEqualTo(2);
        assertThat(series.get(5).count()).isEqualTo(1);
        assertThat(series.get(0).count()).isZero();
    }

    @Test
    void chartsSalesFromTheDayAPieceWasMarkedSold() {
        Antique sold = antique("Chair", null, true, 0);
        when(antiques.findAll()).thenReturn(List.of(sold, antique("Lamp", null, false, 0)));
        when(views.findCreatedAtSince(any())).thenReturn(List.of());

        List<DayCount> series = new GalleryStatsService(antiques, views).stats(7).soldPerDay();

        assertThat(sold.getSoldAt()).isNotNull();
        assertThat(series.get(6).count()).isEqualTo(1);
        assertThat(series.get(6).day()).isEqualTo(LocalDate.now(ZONE));
    }

    @Test
    void forgetsTheSaleDateWhenAPieceGoesBackOnOffer() {
        Antique piece = antique("Chair", null, true, 0);
        assertThat(piece.getSoldAt()).isNotNull();

        piece.setSold(false);

        assertThat(piece.isSold()).isFalse();
        assertThat(piece.getSoldAt()).isNull();
    }

    private static Antique antique(String title, Category category, boolean sold, int views) {
        Antique antique = new Antique(title, null, "A piece", null, null, category);
        for (int count = 0; count < views; count += 1) antique.addViewer();
        if (sold) antique.setSold(true);
        return antique;
    }
}
