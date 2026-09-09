package be.galerie_de_ruiter.project.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import be.galerie_de_ruiter.project.domain.Designer;

public interface DesignerRepository extends JpaRepository<Designer, UUID> {
}
