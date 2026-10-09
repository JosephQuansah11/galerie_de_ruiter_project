package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.HomeImage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HomeImageRepository extends JpaRepository<HomeImage, UUID> {
    List<HomeImage> findAllByOrderByDisplayOrderAsc();
}
