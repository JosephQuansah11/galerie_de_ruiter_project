package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.AboutContent;
import be.galerie_de_ruiter.project.dto.AboutContentRequest;
import be.galerie_de_ruiter.project.repository.AboutContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AboutContentService {
    private static final String PAGE_ID = "about";
    private static final String DEFAULT_CONTENT = """
            # Welcome to Galerie de Ruiter

            ### A journey through antiques, art, design and objects with a story
            **Welcome to Galerie de Ruiter.**

            This pop-up is an invitation to discover a collection shaped by curiosity, travel and a genuine appreciation for beautiful objects.

            Behind Galerie de Ruiter is **Dhirk Dhoey**, an antique dealer with a passion for discovering objects that have lived a life before they arrive here. His work takes him across borders and cultures, searching for antiques, vintage pieces, art, furniture and unusual objects that catch his eye.

            For Dhirk, collecting is not simply about finding something old.

            It is about **seeing beauty where others might overlook it**.

            ---

            ## The story behind Galerie de Ruiter
            Galerie de Ruiter has grown from a love of objects that carry something with them: a sense of history, craftsmanship, character or simply an unmistakable aesthetic.

            Dhirk travels internationally to source pieces, meeting people, visiting collections and discovering objects in places where their stories have been developing for decades—or sometimes much longer.

            Every acquisition begins with the same question:

            **What makes this object special?**

            Sometimes it is the craftsmanship.
            Sometimes the material.
            Sometimes the design.
            Sometimes the history.
            And sometimes it is simply the feeling an object creates when you first see it.

            That instinct for discovery is at the heart of Galerie de Ruiter.

            ---

            # Dhirk Dhoey
            ### Antique dealer • Collector • Discoverer
            Dhirk Dhoey is an antique dealer driven by **curiosity and a personal appreciation for beauty**.

            Rather than limiting himself to one period, style or category, he looks across the world of **antiques, art, vintage, design, furniture and decorative objects**.

            His work involves travelling, searching, researching, negotiating and, most importantly, looking.

            Looking for the unusual.
            Looking for quality.
            Looking for objects with character.
            And looking for those pieces that still have the power to surprise.

            His eye moves naturally between different periods and styles—from traditional antiques to mid-century design, from decorative objects to furniture, from artworks and collectibles to pieces whose original purpose may have almost been forgotten.

            That eclectic approach is part of what makes Galerie de Ruiter distinctive.

            ---

            ## More than antiques
            The collection at Galerie de Ruiter is not intended to fit neatly into one category.

            It sits at the intersection of:

            **ANTIQUES**
            Objects with history, craftsmanship and the marks of another era.

            **ART**
            Works and objects selected for their visual character, cultural interest and ability to create a connection with the viewer.

            **DESIGN**
            Furniture, lighting and objects where form, function and creativity come together.

            **VINTAGE**
            Pieces from the 20th century and beyond that continue to feel relevant, distinctive and desirable.

            **FURNITURE**
            From statement pieces to functional objects, selected for their materials, proportions, construction and character.

            **DECOR**
            Smaller objects and details that can transform an interior and give a space its personality.

            ---

            # Objects with a past. Pieces for the present.
            One of the pleasures of buying an antique or vintage object is knowing that it has already belonged somewhere.

            It may have stood in someone's home, been part of a collection, travelled between countries or simply spent decades waiting to be rediscovered.

            Galerie de Ruiter gives these objects another chapter.

            The aim is not to recreate the past, but to **bring the past into conversation with the present**.

            A centuries-old object can sit beside contemporary furniture.
            A vintage design piece can completely change the character of a modern interior.
            A decorative antique can become the detail that makes a room feel personal.
            And an unexpected object can become the starting point for an entire interior.

            ---

            ## The art of discovering
            For Dhirk, the search itself is part of the adventure.

            Travelling around the world means encountering different cultures, different approaches to craftsmanship and different ideas about what makes an object valuable.

            It also means discovering beauty in unexpected places.

            That is why the Galerie de Ruiter collection is intentionally eclectic.

            **There is no single formula.**

            The common thread is the eye behind the selection: an appreciation for objects that have **beauty, character, craftsmanship, history or simply a strong presence**.

            ---

            # The Galerie de Ruiter Pop-Up
            This pop-up brings that way of collecting into a temporary space where objects can be experienced together.

            Rather than presenting a conventional showroom, Galerie de Ruiter creates a setting where **art, antiques, furniture, design and decoration can live alongside one another**.

            Walk through the collection slowly.
            Look at the details.
            Discover the materials, shapes and imperfections.
            Imagine where a piece has been.
            And perhaps, most importantly, imagine **where it could go next**.

            Because the story of an antique doesn't end when it leaves its previous owner.

            **It continues with you.**

            ---

            ### Galerie de Ruiter
            **Antiques · Art · Design · Vintage · Furniture · Decor**

            *Collected around the world. Selected with an eye for beauty. Ready for a new story.*
            """;

    private final AboutContentRepository contentRepository;

    @Transactional(readOnly = true)
    public String getContent() {
        return contentRepository.findById(PAGE_ID)
                .map(AboutContent::getContent)
                .orElse(DEFAULT_CONTENT);
    }

    public String updateContent(AboutContentRequest request) {
        AboutContent content = contentRepository.findById(PAGE_ID)
                .orElseGet(() -> new AboutContent(PAGE_ID, DEFAULT_CONTENT));
        content.setContent(request.content());
        return contentRepository.save(content).getContent();
    }
}
