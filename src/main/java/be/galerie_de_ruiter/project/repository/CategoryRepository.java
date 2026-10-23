package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.Category;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    boolean existsByNameIgnoreCaseAndParentId(String name, UUID parentId);

    /**
     * Every category with the number of pieces filed under it, as a row rather than an entity.
     *
     * <p>Counting through {@code category.getAntiques()} initializes the collection: Hibernate then
     * reads every Antique of every category - including the legacy photograph column - only to call
     * {@code size()}. The public category list is drawn on every page load, so a count became the
     * whole catalogue in the heap, once per request. PostgreSQL can count the rows without sending
     * them.</p>
     */
    @Query("""
            select c.id as id, c.name as name, c.visible as visible, p.id as parentId,
                   p.name as parentName,
                   (select count(a.id) from Antique a where a.category = c) as itemCount
            from Category c
            left join c.parent p
            """)
    List<CategoryCount> findAllWithCounts();

    /** One row of {@link #findAllWithCounts()}. */
    interface CategoryCount {
        UUID getId();

        String getName();

        boolean isVisible();

        UUID getParentId();

        String getParentName();

        long getItemCount();
    }
}