package be.galerie_de_ruiter.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Editable copy for the dashboard / home page. A field that is left blank falls back to
 * the translated text, so the page keeps working in every language until the gallery
 * writes its own words.
 */
@Entity
@Table(name = "home_content")
@Getter
@Setter
@NoArgsConstructor
public class HomeContent {
    @Id
    private String id;

    @Column(columnDefinition = "TEXT")
    private String heroTitle;

    @Column(columnDefinition = "TEXT")
    private String heroIntro;

    @Column(columnDefinition = "TEXT")
    private String philosophyText;

    @Column(columnDefinition = "TEXT")
    private String visitText;

    @Column(columnDefinition = "TEXT")
    private String storyParagraphs;

    public HomeContent(String id) {
        this.id = id;
    }
}
