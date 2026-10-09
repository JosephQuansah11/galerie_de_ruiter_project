package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.HomeContent;

public record HomeContentResponse(
        String heroTitle,
        String heroIntro,
        String philosophyText,
        String visitText,
        String storyParagraphs) {

    public static HomeContentResponse from(HomeContent content) {
        return new HomeContentResponse(
                content.getHeroTitle(),
                content.getHeroIntro(),
                content.getPhilosophyText(),
                content.getVisitText(),
                content.getStoryParagraphs());
    }

    public static HomeContentResponse empty() {
        return new HomeContentResponse(null, null, null, null, null);
    }
}
