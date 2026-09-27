package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.Category;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByVisibleTrueAndParentIsNullOrderByNameAsc();
    boolean existsByNameIgnoreCaseAndParentId(String name, UUID parentId);
}