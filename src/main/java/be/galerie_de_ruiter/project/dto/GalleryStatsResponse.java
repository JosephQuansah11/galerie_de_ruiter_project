package be.galerie_de_ruiter.project.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * What the gallery's dashboard shows: how much of the collection is sold or still on offer, per
 * category, and how the interest in it moved over time.
 *
 * <p>Every number comes from rows the site already keeps - the antiques, their category, the day
 * a piece was marked sold and the day a distinct visitor opened a piece - so the dashboard never
 * invents a figure and nothing has to be counted by hand.</p>
 */
public record GalleryStatsResponse(
        Totals totals,
        List<CategoryStats> categories,
        List<DayCount> viewsPerDay,
        List<DayCount> soldPerDay) {

    /** The whole collection at a glance. */
    public record Totals(long antiques, long sold, long available, long views, long likes) {
    }

    /**
     * One row of the breakdown. A category with a parent is a subcategory, and the parent's name
     * travels with it so the dashboard can show the collection it belongs to.
     */
    public record CategoryStats(
            UUID id, String name, String parentName, long antiques, long sold, long available, long views) {
    }

    /** One point of a time series: a day and how much happened on it. */
    public record DayCount(LocalDate day, long count) {
    }
}
