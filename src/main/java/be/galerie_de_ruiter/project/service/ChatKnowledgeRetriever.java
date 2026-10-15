package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Category;
import be.galerie_de_ruiter.project.domain.StoreLocation;
import be.galerie_de_ruiter.project.dto.ChatSource;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.ChatCatalogueProjection;
import be.galerie_de_ruiter.project.repository.CategoryRepository;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatKnowledgeRetriever {
    private static final int MAX_RESULTS = 7;
    private static final int MAX_ABOUT_CHUNK_LENGTH = 900;
    private static final int MAX_FIELD_LENGTH = 1200;
    private static final Set<String> STOP_WORDS = Set.of(
            "the", "and", "for", "with", "what", "where", "when", "how", "can", "could", "would", "please",
            "this", "that", "there", "from", "about", "have", "does", "are", "was", "you", "your", "our",
            "een", "het", "de", "en", "voor", "met", "wat", "waar", "wanneer", "hoe", "kan", "kunt", "dit",
            "dat", "zijn", "over", "van", "naar", "les", "des", "une", "pour", "avec", "quoi", "quel",
            "quelle", "comment", "est", "sont", "dans", "vous", "nous", "der", "die", "das", "und", "mit",
            "wie", "wo", "ist", "sind", "ein", "eine", "von", "zu", "bitte");

    /**
     * The words a visitor uses to ask where the gallery is and when it is open, in the languages
     * the site ships. The location document is written in English, so its own words cannot tell a
     * Dutch "waar is de galerie" apart from a question about a chair: the source link to the
     * location page is offered on these words, and the address itself is always in the context.
     */
    private static final Set<String> LOCATION_TERMS = Set.of(
            // English
            "location", "address", "opening", "hours", "open", "where", "when", "visit", "map", "gallery",
            // Dutch
            "locatie", "adres", "openingstijden", "openingsuren", "waar", "wanneer", "bezoek", "kaart", "galerie",
            // French
            "adresse", "horaire", "horaires", "ouvert", "ouverte", "quand", "ou", "visite", "plan",
            // German
            "standort", "offnungszeiten", "geoffnet", "wann", "wo", "besuch");

    private final AntiqueRepository antiques;
    private final CategoryRepository categories;
    private final StoreLocationService locations;
    private final AboutContentService aboutContent;

    public RetrievedKnowledge retrieve(String question) {
        // The gallery's address and opening hours come from the store_location row - the same
        // record the location page and the About page show - and they are kept apart from the
        // scored documents below, because they are always part of the context: it is one line of
        // public information, and the document is written in English while a visitor asks in
        // Dutch, French or German. Scoring would miss "waar is de galerie" or "wo ist die
        // Galerie", and the assistant would have to invent an answer to a location question.
        List<KnowledgeDocument> location = new ArrayList<>();
        addLocationDocuments(location, locations.get());

        List<KnowledgeDocument> documents = new ArrayList<>();
        addCategoryDocuments(documents, categories.findAll());
        addAboutDocuments(documents, aboutContent.getContent());
        addCatalogueDocuments(documents, antiques.findChatCatalogueEntries());

        Set<String> queryTerms = terms(question);
        List<KnowledgeDocument> matches = documents.stream()
                .map(document -> new ScoredDocument(document, score(document, queryTerms)))
                .filter(scored -> scored.score() > 0)
                .sorted(Comparator.comparingDouble(ScoredDocument::score).reversed())
                .limit(MAX_RESULTS)
                .map(ScoredDocument::document)
                .toList();

        List<KnowledgeDocument> context = new ArrayList<>(location);
        context.addAll(matches);

        // The location page is only offered as a source when the question was about the gallery's
        // whereabouts, so every reply does not end up citing the map.
        List<ChatSource> sources = Stream
                .concat(asksAboutLocation(question) ? location.stream() : Stream.<KnowledgeDocument>empty(),
                        matches.stream())
                .map(document -> new ChatSource(document.title(), document.url()))
                .distinct()
                .toList();
        String contextText = context.isEmpty()
                ? "No relevant public website or catalogue information was found for this question."
                : context.stream().map(ChatKnowledgeRetriever::formatDocument).collect(Collectors.joining("\n\n"));
        return new RetrievedKnowledge(contextText, sources);
    }

    private static void addLocationDocuments(List<KnowledgeDocument> documents, StoreLocation location) {
        addIfPresent(documents, "Gallery location and opening hours",
                "Address: " + safe(location.getAddress()) + ". Opening hours: " + safe(location.getOpeningHours()) + ".",
                "/map");
    }

    private static void addCategoryDocuments(List<KnowledgeDocument> documents, List<Category> allCategories) {
        List<String> visibleNames = allCategories.stream()
                .filter(Category::isVisible)
                .map(Category::getName)
                .filter(name -> name != null && !name.isBlank())
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
        String contents = "There are %d visible catalogue categories: %s."
                .formatted(visibleNames.size(), visibleNames.isEmpty() ? "none" : String.join(", ", visibleNames));
        documents.add(new KnowledgeDocument("Visible catalogue categories", contents, "/antiques"));
    }

    private static void addAboutDocuments(List<KnowledgeDocument> documents, String content) {
        if (content == null || content.isBlank()) return;
        for (String paragraph : content.split("(?:\\r?\\n\\s*){2,}")) {
            String chunk = paragraph.replaceAll("\\s+", " ").trim();
            if (chunk.isBlank()) continue;
            if (chunk.length() <= MAX_ABOUT_CHUNK_LENGTH) {
                addIfPresent(documents, "About Galerie de Ruiter", chunk, "/about");
                continue;
            }
            for (int start = 0; start < chunk.length(); start += MAX_ABOUT_CHUNK_LENGTH) {
                addIfPresent(documents, "About Galerie de Ruiter",
                        chunk.substring(start, Math.min(start + MAX_ABOUT_CHUNK_LENGTH, chunk.length())), "/about");
            }
        }
    }

    private static void addCatalogueDocuments(List<KnowledgeDocument> documents,
            List<ChatCatalogueProjection> entries) {
        for (ChatCatalogueProjection entry : entries) {
            String artist = Stream.of(entry.getArtistFirstName(), entry.getArtistMiddleName(), entry.getArtistLastName())
                    .filter(name -> name != null && !name.isBlank()).collect(Collectors.joining(" "));
            String contents = "Item: %s. Artist: %s. Category: %s. Description: %s. Price: %s. Availability: %s."
                    .formatted(
                            safe(entry.getTitle()),
                            artist.isBlank() ? "Not provided" : safe(artist),
                            safe(entry.getCategory()),
                            safe(entry.getDescription()),
                            entry.getPrice() == null ? "On request" : entry.getPrice().toPlainString(),
                            entry.getSold() ? "Sold" : "Available");
            documents.add(new KnowledgeDocument(
                    "Catalogue item: " + safe(entry.getTitle()),
                    contents,
                    "/antiques/" + entry.getId()));
        }
    }

    private static void addIfPresent(List<KnowledgeDocument> documents, String title, String content, String url) {
        if (content == null || content.isBlank()) return;
        documents.add(new KnowledgeDocument(title, limit(content), url));
    }

    private static double score(KnowledgeDocument document, Set<String> queryTerms) {
        if (queryTerms.isEmpty()) return 0;
        Set<String> documentTerms = terms(document.title() + " " + document.content());
        long overlap = queryTerms.stream().filter(documentTerms::contains).count();
        if (overlap == 0) return 0;
        long titleOverlap = queryTerms.stream().filter(terms(document.title())::contains).count();
        return (overlap + titleOverlap * 2.0) / Math.sqrt(documentTerms.size());
    }

    private static Set<String> terms(String text) {
        return java.util.Arrays.stream(words(text))
                .filter(term -> term.length() > 2 && !STOP_WORDS.contains(term))
                .collect(Collectors.toSet());
    }

    /**
     * Whether the visitor is asking where the gallery is or when it is open. This reads the raw
     * words, not the filtered terms: a German "wo" or a French "ou" is a stop word for scoring,
     * yet it is exactly how those visitors ask for the location.
     */
    private static boolean asksAboutLocation(String question) {
        return java.util.Arrays.stream(words(question)).anyMatch(LOCATION_TERMS::contains);
    }

    /** The words of a text, without accents and in lower case. */
    private static String[] words(String text) {
        return Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .split("[^a-z0-9]+");
    }

    private static String formatDocument(KnowledgeDocument document) {
        return "[Retrieved public source: %s]\n%s".formatted(document.title(), quoteAsData(document.content()));
    }

    private static String quoteAsData(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\r", "\\r").replace("\n", "\\n") + "\"";
    }

    private static String safe(String value) {
        return limit(value == null || value.isBlank() ? "Not provided" : value.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", " ").trim());
    }

    private static String limit(String value) {
        String text = value.replaceAll("\\s+", " ").trim();
        return text.length() <= MAX_FIELD_LENGTH ? text : text.substring(0, MAX_FIELD_LENGTH);
    }

    public record RetrievedKnowledge(String context, List<ChatSource> sources) {
    }

    private record KnowledgeDocument(String title, String content, String url) {
    }

    private record ScoredDocument(KnowledgeDocument document, double score) {
    }
}
