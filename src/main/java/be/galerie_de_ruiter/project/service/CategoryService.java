package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Category;
import be.galerie_de_ruiter.project.dto.CategoryRequest;
import be.galerie_de_ruiter.project.repository.CategoryRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {
    private static final List<String> DEFAULT_CATEGORIES = List.of("Antiques", "Art", "Design vintage", "Furniture", "Decor", "Lighting", "AV");
    private final CategoryRepository categories;

    @PostConstruct
    void seedDefaults() {
        if (categories.count() == 0) {
            categories.saveAll(DEFAULT_CATEGORIES.stream().map(name -> new Category(name, null, true)).toList());
        }
    }

    @Transactional(readOnly = true)
    public List<Category> findVisible() {
        return categories.findByVisibleTrueAndParentIsNullOrderByNameAsc().stream()
                .sorted(Comparator.comparingInt((Category category) -> category.getAntiques().size()).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Category> findAll() {
        return categories.findAll();
    }

    public Category create(CategoryRequest request) {
        String name = request.name().trim();
        if (categories.existsByNameIgnoreCaseAndParentId(name, request.parentId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A category with this name already exists here");
        }
        return categories.save(new Category(name, parent(request.parentId()), request.visible()));
    }

    public Category update(UUID id, CategoryRequest request) {
        Category category = get(id);
        String name = request.name().trim();
        if (categories.existsByNameIgnoreCaseAndParentId(name, request.parentId())
                && !(category.getName().equalsIgnoreCase(name)
                && java.util.Objects.equals(category.getParent() == null ? null : category.getParent().getId(), request.parentId()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A category with this name already exists here");
        }
        category.setName(name);
        category.setParent(parent(request.parentId()));
        category.setVisible(request.visible());
        return categories.save(category);
    }

    public void delete(UUID id) {
        categories.delete(get(id));
    }

    private Category get(UUID id) {
        return categories.findById(id).orElseThrow(() -> new EntityNotFoundException("Category not found: " + id));
    }

    private Category parent(UUID id) {
        return id == null ? null : get(id);
    }
}