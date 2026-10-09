package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.HomeContent;
import be.galerie_de_ruiter.project.dto.HomeContentRequest;
import be.galerie_de_ruiter.project.repository.HomeContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Single-row content store for the dashboard / home page. Blank values are stored as
 * blank, which tells the frontend to show the translated default instead.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class HomeContentService {
    private static final String PAGE_ID = "home";

    private final HomeContentRepository content;

    @Transactional(readOnly = true)
    public HomeContent get() {
        return content.findById(PAGE_ID).orElseGet(() -> new HomeContent(PAGE_ID));
    }

    public HomeContent update(HomeContentRequest request) {
        HomeContent home = content.findById(PAGE_ID).orElseGet(() -> new HomeContent(PAGE_ID));
        home.setHeroTitle(trim(request.heroTitle()));
        home.setHeroIntro(trim(request.heroIntro()));
        home.setPhilosophyText(trim(request.philosophyText()));
        home.setVisitText(trim(request.visitText()));
        home.setStoryParagraphs(trim(request.storyParagraphs()));
        return content.save(home);
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }
}
