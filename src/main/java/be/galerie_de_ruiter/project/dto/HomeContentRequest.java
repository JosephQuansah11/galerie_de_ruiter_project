package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.HomeContent;
import jakarta.validation.constraints.Size;

/**
 * Home page copy. Every field is optional: an empty value restores the translated default.
 */
public record HomeContentRequest(
        @Size(max = 300) String heroTitle,
        @Size(max = 1000) String heroIntro,
        @Size(max = 1000) String philosophyText,
        @Size(max = 1000) String visitText,
        @Size(max = 12000) String storyParagraphs) {
}
