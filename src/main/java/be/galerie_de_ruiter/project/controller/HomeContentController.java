package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.HomeContentRequest;
import be.galerie_de_ruiter.project.dto.HomeContentResponse;
import be.galerie_de_ruiter.project.service.HomeContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeContentController {
    private final HomeContentService content;

    @GetMapping
    public HomeContentResponse get() {
        return HomeContentResponse.from(content.get());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public HomeContentResponse update(@Valid @RequestBody HomeContentRequest request) {
        return HomeContentResponse.from(content.update(request));
    }
}
