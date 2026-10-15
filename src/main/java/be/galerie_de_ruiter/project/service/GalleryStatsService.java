package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.Category;
import be.galerie_de_ruiter.project.dto.GalleryStatsResponse;
import be.galerie_de_ruiter.project.dto.GalleryStatsResponse.CategoryStats;
import be.galerie_de_ruiter.project.dto.GalleryStatsResponse.DayCount;
import be.galerie_de_ruiter.project.dto.GalleryStatsResponse.Totals;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.AntiqueViewRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Counts the gallery's own numbers for its dashboard: what is sold and what is still on offer,
 * per collection and subcategory, and how the interest in the collection moved over time.
 *
 * <p>The gallery is small enough to count in memory over its own rows, which keeps the queries
 * portable and every figure the one the catalogue itself shows. Views are distinct visitors - the
 * site stores one row per visitor per piece - so the chart counts people, not page loads.</p>
 */
@Service
@RequiredArgsConstructor
public class GalleryStatsService {
    /** How far back the time series goes when the caller does not say. */
    public static final int DEFAULT_DAYS = 30;
    private static final int MIN_DAYS = 7;
    private static final int MAX_DAYS = 365;
    /** The gallery's own timezone, so a day on the chart is a day in the shop. */
    private static final ZoneId ZONE = ZoneId.of("Europe/Brussels");

    private final AntiqueRepository antiques;
    private final AntiqueViewRepository views;

    @Transactional(readOnly = true)
    public GalleryStatsResponse stats(Integer days) {
        int window = clamp(days);
        LocalDate today = LocalDate.now(ZONE);
        LocalDate firstDay = today.minusDays(window - 1L);

        List<Antique> collection = antiques.findAll();
        long sold = collection.stream().filter(Antique::isSold).count();

        return new GalleryStatsResponse(
                new Totals(
                        collection.size(),
                        sold,
                        collection.size() - sold,
                        collection.stream().mapToLong(Antique::getViewCount).sum(),
                        collection.stream().mapToLong(Antique::getLikeCount).sum()),
                categoryStats(collection),
                viewsPerDay(firstDay, window),
                soldPerDay(collection, firstDay, window));
    }

    private static int clamp(Integer days) {
        if (days == null) return DEFAULT_DAYS;
        return Math.min(MAX_DAYS, Math.max(MIN_DAYS, days));
    }

    /** One row per category the collection uses, a subcategory carrying its parent's name. */
    private static List<CategoryStats> categoryStats(List<Antique> collection) {
        Map<Category, List<Antique>> byCategory = new LinkedHashMap<>();
        List<Antique> withoutCategory = new ArrayList<>();
        for (Antique antique : collection) {
            if (antique.getCategory() == null) withoutCategory.add(antique);
            else byCategory.computeIfAbsent(antique.getCategory(), key -> new ArrayList<>()).add(antique);
        }
        List<CategoryStats> rows = byCategory.entrySet().stream()
                .sorted(Comparator.comparing(entry -> sortKey(entry.getKey())))
                .map(entry -> row(entry.getKey(), entry.getValue()))
                .collect(Collectors.toCollection(ArrayList::new));
        if (!withoutCategory.isEmpty()) rows.add(row(null, withoutCategory));
        return rows;
    }

    /** "Collection / subcategory", so a parent and its children sort next to each other. */
    private static String sortKey(Category category) {
        String name = category.getName() == null ? "" : category.getName().toLowerCase(Locale.ROOT);
        if (category.getParent() == null) return name;
        String parent = category.getParent().getName();
        return (parent == null ? "" : parent.toLowerCase(Locale.ROOT)) + "/" + name;
    }

    private static CategoryStats row(Category category, List<Antique> items) {
        long sold = items.stream().filter(Antique::isSold).count();
        return new CategoryStats(
                category == null ? null : category.getId(),
                category == null ? null : category.getName(),
                category == null || category.getParent() == null ? null : category.getParent().getName(),
                items.size(),
                sold,
                items.size() - sold,
                items.stream().mapToLong(Antique::getViewCount).sum());
    }

    /** Distinct views per day: the day a visitor first opened a piece. */
    private List<DayCount> viewsPerDay(LocalDate firstDay, int window) {
        Instant since = firstDay.atStartOfDay(ZONE).toInstant();
        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (Instant viewedAt : views.findCreatedAtSince(since)) {
            counts.merge(viewedAt.atZone(ZONE).toLocalDate(), 1L, Long::sum);
        }
        return series(firstDay, window, counts);
    }

    /** Pieces marked sold per day, which is known for sales since the date is recorded. */
    private static List<DayCount> soldPerDay(List<Antique> collection, LocalDate firstDay, int window) {
        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (Antique antique : collection) {
            if (antique.getSoldAt() == null) continue;
            LocalDate day = antique.getSoldAt().atZone(ZONE).toLocalDate();
            if (day.isBefore(firstDay)) continue;
            counts.merge(day, 1L, Long::sum);
        }
        return series(firstDay, window, counts);
    }

    /** Every day of the window, so a quiet day is a zero on the chart rather than a gap. */
    private static List<DayCount> series(LocalDate firstDay, int window, Map<LocalDate, Long> counts) {
        List<DayCount> series = new ArrayList<>(window);
        for (int offset = 0; offset < window; offset += 1) {
            LocalDate day = firstDay.plusDays(offset);
            series.add(new DayCount(day, counts.getOrDefault(day, 0L)));
        }
        return series;
    }
}
