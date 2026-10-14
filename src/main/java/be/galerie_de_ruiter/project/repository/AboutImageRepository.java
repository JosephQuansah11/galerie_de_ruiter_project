package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.AboutImage;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AboutImageRepository extends JpaRepository<AboutImage, UUID> {
}
