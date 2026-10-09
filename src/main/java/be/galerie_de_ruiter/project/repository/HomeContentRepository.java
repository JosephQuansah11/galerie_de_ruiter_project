package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.HomeContent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HomeContentRepository extends JpaRepository<HomeContent, String> {
}
