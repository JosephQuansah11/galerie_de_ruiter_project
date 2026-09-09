package be.galerie_de_ruiter.project.domain;

import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Setter 
@Entity
@Table(name = "designers")
@NoArgsConstructor 
public class Designer {
    @Id 
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String firstName;
    private String middleName;
    private String lastName;
        @OneToMany(
        mappedBy = "artist",
        cascade = CascadeType.ALL
    )
    private List<Antique> antiques = new ArrayList<>();

    public Designer(String firstName, String middleName, String lastName) {
        this.firstName = firstName;
        this.middleName = middleName;
        this.lastName = lastName;
    }
}
