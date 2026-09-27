package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.AboutContent;

public record AboutContentResponse(String content) {
    public static AboutContentResponse from(AboutContent aboutContent) {
        return new AboutContentResponse(aboutContent.getContent());
    }
}
