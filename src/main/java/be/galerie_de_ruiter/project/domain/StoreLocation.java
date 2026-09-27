package be.galerie_de_ruiter.project.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "store_location")
@Getter
@Setter
@NoArgsConstructor
public class StoreLocation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String address;
    private String openingHours;
    private BigDecimal latitude;
    private BigDecimal longitude;

    public StoreLocation(String address, String openingHours, BigDecimal latitude, BigDecimal longitude) {
        this.address = address;
        this.openingHours = openingHours;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}