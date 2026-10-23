package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.CategoryRequest;
import be.galerie_de_ruiter.project.dto.CategoryResponse;
import be.galerie_de_ruiter.project.service.CategoryService;
import be.galerie_de_ruiter.project.service.ContentWebSocketHandler;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categories;
    private final ContentWebSocketHandler contentUpdates;

    @GetMapping
    public List<CategoryResponse> visible() {
        return categories.findVisibleResponses();
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CategoryResponse> all() {
        return categories.findAllResponses();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse create(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse created = categories.createResponse(request);
        contentUpdates.broadcast("categories");
        return created;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse update(@PathVariable UUID id, @Valid @RequestBody CategoryRequest request) {
        CategoryResponse updated = categories.updateResponse(id, request);
        contentUpdates.broadcast("categories");
        return updated;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        categories.delete(id);
        contentUpdates.broadcast("categories");
        return ResponseEntity.noContent().build();
    }
}