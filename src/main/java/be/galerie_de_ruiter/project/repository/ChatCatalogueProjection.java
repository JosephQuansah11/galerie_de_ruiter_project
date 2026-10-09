package be.galerie_de_ruiter.project.repository;

import java.math.BigDecimal;
import java.util.UUID;

public interface ChatCatalogueProjection {
    String getTitle();
    String getArtistFirstName();
    String getArtistMiddleName();
    String getArtistLastName();
    String getDescription();
    BigDecimal getPrice();
    String getCategory();
    UUID getId();
}
