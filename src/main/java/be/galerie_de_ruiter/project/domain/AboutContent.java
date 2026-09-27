package be.galerie_de_ruiter.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "about_content")
@Getter
@Setter
@NoArgsConstructor
public class AboutContent {
    @Id
    private String id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    public AboutContent(String id, String content) {
        this.id = id;
        this.content = content;
    }
}
