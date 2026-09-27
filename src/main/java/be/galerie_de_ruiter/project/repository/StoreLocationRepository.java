package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.StoreLocation;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreLocationRepository extends JpaRepository<StoreLocation, UUID> {
}