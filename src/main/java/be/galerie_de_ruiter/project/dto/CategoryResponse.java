package be.galerie_de_ruiter.project.dto;

import java.util.List;
import java.util.UUID;

/**
 * One category and the pieces filed directly under it.
 *
 * <p>There is deliberately no {@code from(Category)}: mapping the entity reads its lazy
 * {@code antiques} collection to count it, which pulls every piece - and every legacy photograph
 * blob - into the heap. The count is asked of PostgreSQL instead (see
 * {@code CategoryRepository.findAllWithCounts()}).</p>
 */
public record CategoryResponse(UUID id, String name, boolean visible, UUID parentId, String parentName,
                               long itemCount, List<CategoryResponse> children) {
}