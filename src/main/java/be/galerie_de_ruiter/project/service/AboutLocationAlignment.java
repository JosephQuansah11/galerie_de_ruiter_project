package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.AboutContent;
import be.galerie_de_ruiter.project.domain.StoreLocation;
import be.galerie_de_ruiter.project.repository.AboutContentRepository;
import be.galerie_de_ruiter.project.repository.StoreLocationRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Keeps the About page's location in step with the rest of the site.
 *
 * <p>The gallery's address is owned by the {@code store_location} row, which is also the
 * source the concierge chat answers from. The About story is free text an admin edits, so an
 * older copy could still name a different city — for example a hardcoded "Amsterdam" that
 * predates the store location. On startup that stale city is replaced with the live address,
 * so the About page never contradicts the location the chat and the map show.</p>
 */
@Component
@RequiredArgsConstructor
public class AboutLocationAlignment {
    private static final Logger logger = LoggerFactory.getLogger(AboutLocationAlignment.class);

    private static final String PAGE_ID = "about";
    /** The hardcoded city the About copy used before the store location became the source. */
    private static final String STALE_LOCATION = "Amsterdam";

    private final AboutContentRepository about;
    private final StoreLocationRepository locations;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void alignStoredLocation() {
        Optional<StoreLocation> storedLocation = locations.findAll().stream().findFirst();
        if (storedLocation.isEmpty()) return;
        String address = storedLocation.get().getAddress();
        if (address == null || address.isBlank()) return;

        about.findById(PAGE_ID).ifPresent(content -> replaceStaleLocation(content, address));
    }

    private void replaceStaleLocation(AboutContent content, String address) {
        String text = content.getContent();
        if (text == null || !text.contains(STALE_LOCATION)) return;
        content.setContent(text.replace(STALE_LOCATION, address));
        about.save(content);
        logger.info("Aligned the About page location with the store address.");
    }
}
