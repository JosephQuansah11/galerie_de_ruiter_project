package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.Category;
import java.util.List;
import java.util.UUID;

public record CategoryResponse(UUID id, String name, boolean visible, UUID parentId, long itemCount, List<CategoryResponse> children) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.isVisible(),
                category.getParent() == null ? null : category.getParent().getId(),
                category.getAntiques().size(),
                category.getChildren().stream().filter(Category::isVisible)
                    .sorted((left, right) -> Integer.compare(right.getAntiques().size(), left.getAntiques().size()))
                    .map(CategoryResponse::from).toList()
        );
    }
}