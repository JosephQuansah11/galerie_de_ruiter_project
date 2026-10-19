package be.galerie_de_ruiter.project.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.dto.GalleryStatsResponse;
import be.galerie_de_ruiter.project.dto.GalleryStatsResponse.CategoryStats;
import be.galerie_de_ruiter.project.dto.GalleryStatsResponse.DayCount;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.AntiqueRepository.StatsRow;
import be.galerie_de_ruiter.project.repository.AntiqueViewRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
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
        when(antiques.findStatsRows()).thenReturn(List.of(
                piece(false, null, 4),
                piece(true, Instant.now(), 2),
                piece(true, Instant.now(), 0)));
        when(views.findCreatedAtSince(any())).thenReturn(List.of());

        GalleryStatsResponse stats = new GalleryStatsService(antiques, views).stats(7);

        assertThat(stats.totals().antiques()).isEqualTo(3);
        assertThat(stats.totals().sold()).isEqualTo(2);
        assertThat(stats.totals().available()).isEqualTo(1);
        assertThat(stats.totals().views()).isEqualTo(6);
    }

    @Test
    void countsWithoutLoadingThePiecesOrTheirPhotographs() {
        when(antiques.findStatsRows()).thenReturn(List.of(piece(false, null, 0)));
        when(views.findCreatedAtSince(any())).thenReturn(List.of());

        new GalleryStatsService(antiques, views).stats(7);

        verify(antiques).findStatsRows();
        // findAll() reads every piece as an entity, legacy photograph column included, just to
        // count it; the projection reads the columns the dashboard actually needs.
        verify(antiques, never()).findAll();
    }

    @Test
    void breaksTheCollectionDownByCategoryAndSubcategory() {
        UUID furniture = UUID.randomUUID();
        UUID mirrors = UUID.randomUUID();
        when(antiques.findStatsRows()).thenReturn(List.of(
                piece(furniture, "Furniture", null, false, 1),
                piece(furniture, "Furniture", null, true, 1),
                piece(mirrors, "Mirrors", "Furniture", false, 3)));
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
        when(antiques.findStatsRows()).thenReturn(List.of(piece(false, null, 0)));
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
        when(antiques.findStatsRows()).thenReturn(List.of(
                piece(true, Instant.now(), 0),
                piece(false, null, 0)));
        when(views.findCreatedAtSince(any())).thenReturn(List.of());

        List<DayCount> series = new GalleryStatsService(antiques, views).stats(7).soldPerDay();

        assertThat(series.get(6).count()).isEqualTo(1);
        assertThat(series.get(6).day()).isEqualTo(LocalDate.now(ZONE));
    }

    @Test
    void forgetsTheSaleDateWhenAPieceGoesBackOnOffer() {
        Antique chair = new Antique("Chair", null, "A piece", null, null, null);
        chair.setSold(true);
        assertThat(chair.getSoldAt()).isNotNull();

        chair.setSold(false);

        assertThat(chair.isSold()).isFalse();
        assertThat(chair.getSoldAt()).isNull();
    }

    /** A dashboard row with no category, for the totals and the two time series. */
    private static StatsRow piece(boolean sold, Instant soldAt, long views) {
        return new Stats(UUID.randomUUID(), sold, soldAt, views, 0, null, null, null);
    }

    /** A dashboard row filed under a category; {@code parentName} is null for a root. */
    private static StatsRow piece(UUID categoryId, String categoryName, String parentName, boolean sold, long views) {
        return new Stats(UUID.randomUUID(), sold, sold ? Instant.now() : null, views, 0,
                categoryId, categoryName, parentName);
    }

    /**
     * The projection the repository returns. A record generates {@code id()} and {@code sold()};
     * the interface asks for getters, so both exist and the getters are written out.
     */
    private record Stats(UUID id, boolean sold, Instant soldAt, long viewCount, long likeCount,
                         UUID categoryId, String categoryName, String parentName) implements StatsRow {
        @Override public UUID getId() { return id; }

        @Override public boolean isSold() { return sold; }

        @Override public Instant getSoldAt() { return soldAt; }

        @Override public long getViewCount() { return viewCount; }

        @Override public long getLikeCount() { return likeCount; }

        @Override public UUID getCategoryId() { return categoryId; }

        @Override public String getCategoryName() { return categoryName; }

        @Override public String getParentName() { return parentName; }
    }
}
