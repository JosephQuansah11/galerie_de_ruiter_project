package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.AboutContentRequest;
import be.galerie_de_ruiter.project.dto.AboutContentResponse;
import be.galerie_de_ruiter.project.service.AboutContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/about")
@RequiredArgsConstructor
public class AboutContentController {
    private final AboutContentService content;

    @GetMapping
    public AboutContentResponse get() {
        return new AboutContentResponse(content.getContent());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AboutContentResponse update(@Valid @RequestBody AboutContentRequest request) {
        return new AboutContentResponse(content.updateContent(request));
    }
}
