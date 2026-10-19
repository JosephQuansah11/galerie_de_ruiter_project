package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Category;
import be.galerie_de_ruiter.project.dto.CategoryResponse;
import be.galerie_de_ruiter.project.dto.CategoryRequest;
import be.galerie_de_ruiter.project.repository.CategoryRepository;
import be.galerie_de_ruiter.project.repository.CategoryRepository.CategoryCount;
import jakarta.persistence.EntityNotFoundException;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
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

    /** Busiest first, which is the order the gallery wants both in the navigation and in admin. */
    private static final Comparator<CategoryCount> BY_ITEM_COUNT_DESCENDING =
            Comparator.comparingLong(CategoryCount::getItemCount).reversed();

    private final CategoryRepository categories;

    @PostConstruct
    void seedDefaults() {
        if (categories.count() == 0) {
            categories.saveAll(DEFAULT_CATEGORIES.stream().map(name -> new Category(name, null, true)).toList());
        }
    }

    /**
     * The categories a visitor sees: visible roots, each with its visible subtree, busiest first.
     *
     * <p>Rows and counts come from one query that never loads an Antique; see
     * {@link CategoryRepository#findAllWithCounts()}. The previous version asked each category for
     * {@code getAntiques().size()}, which read the whole catalogue - photographs included - into the
     * heap on every page load, because the navigation asks for this list on every page.</p>
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> findVisibleResponses() {
        List<CategoryCount> rows = categories.findAllWithCounts();
        Map<UUID, List<CategoryCount>> children = childrenByParent(rows);
        return rows.stream()
                .filter(row -> row.getParentId() == null)
                .filter(CategoryCount::isVisible)
                .sorted(BY_ITEM_COUNT_DESCENDING)
                .map(row -> response(row, children))
                .toList();
    }

    /**
     * Every category, as the admin screen lists them: one response per row, a parent carrying its
     * visible children nested. The same counted rows as the public list, so nothing reads a piece.
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> findAllResponses() {
        List<CategoryCount> rows = categories.findAllWithCounts();
        Map<UUID, List<CategoryCount>> children = childrenByParent(rows);
        return rows.stream().map(row -> response(row, children)).toList();
    }

    public CategoryResponse createResponse(CategoryRequest request) {
        return responseFor(create(request).getId());
    }

    public CategoryResponse updateResponse(UUID id, CategoryRequest request) {
        update(id, request);
        return responseFor(id);
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

    /**
     * One category, built from the same counted rows as the lists. A save response is read back
     * this way rather than from the entity it just saved: the entity's lazy collections would be
     * read to shape it, which is the cost this service exists to avoid.
     */
    private CategoryResponse responseFor(UUID id) {
        List<CategoryCount> rows = categories.findAllWithCounts();
        Map<UUID, List<CategoryCount>> children = childrenByParent(rows);
        return rows.stream()
                .filter(row -> row.getId().equals(id))
                .findFirst()
                .map(row -> response(row, children))
                .orElseThrow(() -> new IllegalStateException("Category not found after saving: " + id));
    }

    private static Map<UUID, List<CategoryCount>> childrenByParent(List<CategoryCount> rows) {
        return rows.stream()
                .filter(row -> row.getParentId() != null)
                .collect(Collectors.groupingBy(CategoryCount::getParentId));
    }

    private static CategoryResponse response(CategoryCount row, Map<UUID, List<CategoryCount>> children) {
        return new CategoryResponse(
                row.getId(),
                row.getName(),
                row.isVisible(),
                row.getParentId(),
                row.getItemCount(),
                children.getOrDefault(row.getId(), List.of()).stream()
                        .filter(CategoryCount::isVisible)
                        .sorted(BY_ITEM_COUNT_DESCENDING)
                        .map(child -> response(child, children))
                        .toList());
    }

    private Category get(UUID id) {
        return categories.findById(id).orElseThrow(() -> new EntityNotFoundException("Category not found: " + id));
    }

    private Category parent(UUID id) {
        return id == null ? null : get(id);
    }
}