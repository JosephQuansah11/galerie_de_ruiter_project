package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.AdminInterestGroupResponse;
import be.galerie_de_ruiter.project.service.AntiqueInterestService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** What visitors marked as interesting, with their names and email addresses. */
@RestController
@RequestMapping("/api/admin/interests")
@RequiredArgsConstructor
public class AdminInterestController {
    private final AntiqueInterestService interests;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminInterestGroupResponse> all() {
        return interests.all();
    }
}
