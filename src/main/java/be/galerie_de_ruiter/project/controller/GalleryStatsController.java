package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.GalleryStatsResponse;
import be.galerie_de_ruiter.project.service.GalleryStatsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * The gallery's dashboard numbers. They are the gallery's own business, so the endpoint is
 * administrators only; the page behind it is behind the same role in the app.
 */
@RestController
@RequestMapping("/api/admin/stats")
public class GalleryStatsController {
    private final GalleryStatsService stats;

    public GalleryStatsController(GalleryStatsService stats) {
        this.stats = stats;
    }

    /** Sold and on offer per collection and subcategory, plus the last {@code days} of views. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public GalleryStatsResponse stats(@RequestParam(name = "days", required = false) Integer days) {
        return stats.stats(days);
    }
}
