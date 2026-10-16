package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Appointment;
import be.galerie_de_ruiter.project.domain.StoreLocation;
import be.galerie_de_ruiter.project.dto.ChatAppointmentSelection;
import be.galerie_de_ruiter.project.dto.ChatConnectionStatus;
import be.galerie_de_ruiter.project.dto.ChatRequest;
import be.galerie_de_ruiter.project.dto.ChatResponse;
import be.galerie_de_ruiter.project.dto.ChatSource;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.AppointmentRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * The gallery chat, answered from the gallery's own records.
 *
 * <p>This used to be a language model on a private Ollama service, which is gone: nobody needs a
 * model to answer what visitors actually ask - where the gallery is and when it is open, how much is
 * in the collection, and how to request a visit. Those are records this application already holds, so
 * they are read and put into a sentence. No inference, no model download, no second service to keep
 * warm, and no way for the answer to invent an address, an opening time or a price.
 *
 * <p>What a template cannot do is talk about anything else, and the reply says so rather than
 * guessing: a question outside {@link Topic} gets an honest "not in our own records" with the
 * gallery's WhatsApp number. That is the trade - a smaller assistant that cannot be wrong about the
 * gallery's facts. The appointment flow and its contract are unchanged: a selection is persisted as
 * an {@link Appointment} and reported as a request the gallery confirms, never as a booking.
 */
@Service
@RequiredArgsConstructor
public class GalleryChatService {
    /** Zone the gallery keeps its appointments in; a request is compared against the clock here. */
    private static final ZoneId GALLERY_ZONE = ZoneId.of("Europe/Brussels");
    /** Public gallery WhatsApp number used when a question has to be handed over. */
    static final String WHATSAPP_URL = "https://wa.me/32493357568";
    private static final String WHATSAPP_SOURCE_TITLE = "WhatsApp";
    /** The languages the site ships. Anything else is answered in the gallery's own language. */
    static final String DEFAULT_LANGUAGE = "nl-BE";
    private static final Set<String> LANGUAGES = Set.of("nl-BE", "nl-NL", "en", "fr", "de");
    /** Human-readable appointment slot used in the reply and in the WhatsApp hand-off message. */
    private static final DateTimeFormatter APPOINTMENT_FORMAT =
            DateTimeFormatter.ofPattern("EEEE d MMMM yyyy 'at' HH:mm", Locale.ENGLISH);
    /** What the status endpoint reports. It is not a model: the chat answers from templates. */
    static final String ASSISTANT = "gallery-templates";
    private static final String READY_DETAIL =
            "The gallery assistant answers from the gallery's own records and is always ready.";

    private final AppointmentRepository appointments;
    private final StoreLocationService locations;
    private final AntiqueRepository antiques;

    /**
     * The chat is never starting up: there is nothing to load, so the answer is ready before the
     * question. The endpoint stays because the chat interface asks for it, and a visitor who is shown
     * a status deserves a true one.
     */
    public ChatConnectionStatus connectionStatus() {
        return new ChatConnectionStatus(true, ASSISTANT, READY_DETAIL);
    }

    /** Nothing to warm up. Kept for the same reason as {@link #connectionStatus()}. */
    public ChatConnectionStatus warmUp() {
        return connectionStatus();
    }

    public ChatResponse reply(ChatRequest request, String subject, String requesterName) {
        ChatAppointmentSelection selection = request.appointmentSelection();
        if (selection != null) return requestAppointment(selection, subject, requesterName);
        String language = languageOf(request.language());
        Topic topic = topicOf(request.message());
        return new ChatResponse(answer(language, topic, facts()), null, null, false, false,
                sourcesFor(language, topic));
    }

    /** The appointment request, persisted and reported exactly as the model-backed path did. */
    private ChatResponse requestAppointment(ChatAppointmentSelection selection, String subject,
            String requesterName) {
        if (!selection.at().isAfter(LocalDateTime.now(GALLERY_ZONE))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a future appointment date and time.");
        }
        if (subject != null && !subject.isBlank()
                && !appointments.existsByKeycloakSubjectAndStartsAtAndType(
                        subject, selection.at(), selection.type())) {
            appointments.save(new Appointment(
                    subject, selection.at(), selection.type(), appointmentSummary(requesterName)));
        }
        return new ChatResponse(
                appointmentMessage(selection, requesterName),
                selection.at(),
                selection.type(),
                false,
                false,
                List.of(appointmentWhatsAppSource(selection, requesterName)));
    }

    /** What the templates fill in, read from the records the rest of the site shows. */
    record Facts(String address, String openingHours, long pieces) {
    }

    private Facts facts() {
        StoreLocation location = locations.get();
        return new Facts(
                location.getAddress() == null ? "" : location.getAddress().trim(),
                location.getOpeningHours() == null ? "" : location.getOpeningHours().trim(),
                antiques.count());
    }

    /** The visitor's language, or the gallery's own when it is missing or not one we ship. */
    static String languageOf(String requested) {
        if (requested == null || requested.isBlank()) return DEFAULT_LANGUAGE;
        String normalized = requested.trim();
        return LANGUAGES.contains(normalized) ? normalized : DEFAULT_LANGUAGE;
    }

    /**
     * What the assistant can answer. Every one of these is a record this application holds; anything
     * else is {@link #FALLBACK}, which says so instead of guessing.
     */
    enum Topic { APPOINTMENT, LOCATION, COLLECTION_COUNT, COLLECTION, GALLERY, GREETING, FALLBACK }

    /** The words a visitor uses, in the languages the site ships, per topic. */
    private static final Set<String> APPOINTMENT_TERMS = Set.of(
            "appointment", "appointments", "book", "booking", "visit", "schedule", "afspraak", "afspraken",
            "bezoek", "bezoeken", "reserveren", "rendez-vous", "rendezvous", "rdv", "visite", "reserver",
            "termin", "besuch", "vereinbaren", "buchen");

    private static final Set<String> LOCATION_TERMS = Set.of(
            "location", "address", "opening", "openingstijden", "openingsuren", "hours", "open", "where",
            "locatie", "adres", "waar", "wanneer", "map", "kaart", "route", "adresse", "horaire", "horaires",
            "ouvert", "ouverte", "ou", "plan", "standort", "offnungszeiten", "geoffnet", "wo", "wann");

    private static final Set<String> COUNT_TERMS = Set.of(
            "how many", "hoeveel", "number of items", "amount of", "combien", "anzahl", "wie viele",
            "wieviele", "total pieces", "aantal");

    private static final Set<String> COLLECTION_TERMS = Set.of(
            "collection", "collectie", "catalogue", "catalog", "antiques", "antiek", "pieces", "stukken",
            "stuk", "objects", "price", "prijs", "prijzen", "cost", "kost", "prix", "cout", "preis",
            "antiquites", "antiquitaten", "voorraad", "stock", "inventory");

    private static final Set<String> GALLERY_TERMS = Set.of(
            "gallery", "galerie", "about", "story", "verhaal", "who are you", "wie zijn jullie", "histoire",
            "uber uns", "geschichte", "philosophy", "filosofie", "pop-up");

    private static final Set<String> GREETING_TERMS = Set.of(
            "hello", "hi", "hey", "good morning", "good afternoon", "good evening", "hallo", "hoi",
            "goedemorgen", "goedemiddag", "goedenavond", "bonjour", "bonsoir", "salut", "guten tag",
            "guten morgen", "thanks", "thank you", "dank", "bedankt", "merci", "danke", "bye", "goodbye",
            "tot ziens", "au revoir", "auf wiedersehen");

    /**
     * Which topic a message is about. A count is checked before the collection words, because "how
     * many pieces" asks for a number and the collection words are the ones it is a number of.
     *
     * <p>Terms are matched as whole words, in order, so the French "ou" and the German "wo" cannot be
     * found inside "vous" or "wollen" - two letters are all a location question needs in those
     * languages, and two letters are also all it takes to match the wrong thing.
     */
    static Topic topicOf(String message) {
        List<String> words = List.of(words(message));
        if (matches(words, COUNT_TERMS)) return Topic.COLLECTION_COUNT;
        if (matches(words, APPOINTMENT_TERMS)) return Topic.APPOINTMENT;
        if (matches(words, LOCATION_TERMS)) return Topic.LOCATION;
        if (matches(words, COLLECTION_TERMS)) return Topic.COLLECTION;
        if (matches(words, GALLERY_TERMS)) return Topic.GALLERY;
        if (matches(words, GREETING_TERMS)) return Topic.GREETING;
        return Topic.FALLBACK;
    }

    private static boolean matches(List<String> words, Set<String> terms) {
        for (String term : terms) {
            String[] parts = term.split(" ");
            for (int start = 0; start + parts.length <= words.size(); start++) {
                boolean found = true;
                for (int offset = 0; offset < parts.length; offset++) {
                    if (!words.get(start + offset).equals(parts[offset])) {
                        found = false;
                        break;
                    }
                }
                if (found) return true;
            }
        }
        return false;
    }

    /** The link that opens the gallery's WhatsApp conversation, with nothing pre-filled. */
    static ChatSource whatsappSource() {
        return new ChatSource(WHATSAPP_SOURCE_TITLE, WHATSAPP_URL);
    }

    /** Plain-language kind of appointment, shared by the reply and the WhatsApp hand-off message. */
    static String appointmentKind(String type) {
        return "ONLINE".equals(type) ? "an online consultation" : "a gallery visit";
    }

    /** The chat's closing appointment reply, naming the slot and who is asking. */
    static String appointmentMessage(ChatAppointmentSelection selection, String requesterName) {
        String who = requesterName == null || requesterName.isBlank() ? "the visitor" : requesterName;
        return ("Appointment request for %s (%s) by %s is ready to send. It is not confirmed until the gallery "
                + "confirms availability. Send it to the gallery on WhatsApp using the link below.")
                .formatted(appointmentKind(selection.type()), APPOINTMENT_FORMAT.format(selection.at()), who);
    }

    /**
     * The WhatsApp hand-off link shown with the closing appointment reply. It is pre-filled with the
     * appointment type, date, time and the requester's name, so the gallery opens a ready-to-send
     * message to the admin instead of an empty conversation.
     */
    static ChatSource appointmentWhatsAppSource(ChatAppointmentSelection selection, String requesterName) {
        StringBuilder text = new StringBuilder("Hello Galerie de Ruiter, I would like to request ")
                .append(appointmentKind(selection.type()))
                .append(" on ")
                .append(APPOINTMENT_FORMAT.format(selection.at()));
        if (requesterName != null && !requesterName.isBlank()) {
            text.append(". My name is ").append(requesterName);
        }
        text.append(". Please confirm availability.");
        return new ChatSource(WHATSAPP_SOURCE_TITLE,
                WHATSAPP_URL + "?text=" + URLEncoder.encode(text.toString(), StandardCharsets.UTF_8));
    }

    private static String appointmentSummary(String requesterName) {
        return requesterName == null || requesterName.isBlank()
                ? "Requested through gallery chat"
                : "Requested through gallery chat by " + requesterName;
    }

    /**
     * The replies, per language. They are templates rather than model output: each one is filled in
     * from a record the gallery keeps, and the fallback says plainly when a question is outside them.
     * Belgian Dutch and Dutch share a set, because these sentences do not differ between them.
     */
    private static final Map<String, String> DUTCH_TEMPLATES = Map.of(
            "greeting", "Hallo! Ik ben de assistent van de galerie. Vraag me gerust naar de collectie, de locatie "
                    + "of de openingstijden, of vraag een bezoek aan.",
            "locationat", "Je vindt de galerie op %s.",
            "openhours", "De openingstijden zijn %s.",
            "collection_count", "In de pop-upgalerie staan nu %d %s.",
            "collection", "De collectie telt %d %s, met foto's, prijzen en het verhaal erachter.",
            "appointment", "Een bezoek of een online afspraak vraag je hier aan: kies een datum en een tijd, dan "
                    + "bevestigt de galerie. Ik kan zelf geen afspraak vastleggen.",
            "gallery", "Galerie de Ruiter is een pop-upgalerie voor antiek, kunst en vintage design, met "
                    + "zorgvuldig uitgekozen stukken en het verhaal erachter.",
            "fallback", "Dat staat niet in de gegevens van de galerie, en ik verzin liever niets. Ik help je "
                    + "graag met de collectie, de locatie en de openingstijden, of met een afspraak; voor al het "
                    + "andere bereik je de galerie via WhatsApp.");

    private static final Map<String, String> ENGLISH_TEMPLATES = Map.of(
            "greeting", "Hello! I am the gallery's assistant. Ask me about the collection, where the gallery is, "
                    + "or when it is open - or request a visit.",
            "locationat", "You will find the gallery at %s.",
            "openhours", "It is open %s.",
            "collection_count", "There are %d %s in the pop-up gallery right now.",
            "collection", "The collection holds %d %s, with photographs, prices and the story behind each piece.",
            "appointment", "Request a visit or an online consultation here: choose a date and a time, and the "
                    + "gallery confirms it. I cannot set an appointment myself.",
            "gallery", "Galerie de Ruiter is a pop-up gallery for antiques, art and vintage design, with "
                    + "carefully chosen pieces and the story behind them.",
            "fallback", "That is not in the gallery's records, and I would rather not invent it. I can help you "
                    + "with the collection, the location and the opening hours, or with an appointment; for "
                    + "anything else, reach the gallery on WhatsApp.");

    private static final Map<String, String> FRENCH_TEMPLATES = Map.of(
            "greeting", "Bonjour ! Je suis l'assistant de la galerie. Interrogez-moi sur la collection, "
                    + "l'emplacement ou les horaires, ou demandez une visite.",
            "locationat", "Vous trouverez la galerie à %s.",
            "openhours", "Les horaires d'ouverture sont %s.",
            "collection_count", "La galerie éphémère compte actuellement %d %s.",
            "collection", "La collection compte %d %s, avec photos, prix et l'histoire de chaque pièce.",
            "appointment", "Demandez ici une visite ou un entretien en ligne : choisissez une date et une heure, "
                    + "et la galerie confirme. Je ne peux pas fixer de rendez-vous moi-même.",
            "gallery", "Galerie de Ruiter est une galerie éphémère d'antiquités, d'art et de design vintage, avec "
                    + "des pièces choisies avec soin et leur histoire.",
            "fallback", "Ce n'est pas dans les données de la galerie, et je préfère ne rien inventer. Je vous aide "
                    + "volontiers pour la collection, l'emplacement et les horaires, ou pour un rendez-vous ; pour "
                    + "tout le reste, contactez la galerie sur WhatsApp.");

    private static final Map<String, String> GERMAN_TEMPLATES = Map.of(
            "greeting", "Hallo! Ich bin der Assistent der Galerie. Fragen Sie mich nach der Kollektion, dem "
                    + "Standort oder den Öffnungszeiten - oder fordern Sie einen Besuch an.",
            "locationat", "Sie finden die Galerie unter %s.",
            "openhours", "Die Öffnungszeiten sind %s.",
            "collection_count", "In der Pop-up-Galerie stehen derzeit %d %s.",
            "collection", "Die Kollektion umfasst %d %s, mit Fotos, Preisen und der Geschichte dahinter.",
            "appointment", "Einen Besuch oder ein Online-Gespräch fordern Sie hier an: wählen Sie Datum und "
                    + "Uhrzeit, und die Galerie bestätigt. Ich kann selbst keinen Termin festlegen.",
            "gallery", "Galerie de Ruiter ist eine Pop-up-Galerie für Antiquitäten, Kunst und Vintage-Design, mit "
                    + "sorgfältig ausgewählten Stücken und ihrer Geschichte.",
            "fallback", "Das steht nicht in den Daten der Galerie, und ich erfinde lieber nichts. Ich helfe Ihnen "
                    + "gern mit der Kollektion, dem Standort und den Öffnungszeiten oder mit einem Termin; für "
                    + "alles andere erreichen Sie die Galerie über WhatsApp.");

    /** Which template set answers which language. Dutch and Belgian Dutch read the same. */
    private static final Map<String, Map<String, String>> TEMPLATES = Map.of(
            "nl-BE", DUTCH_TEMPLATES,
            "nl-NL", DUTCH_TEMPLATES,
            "en", ENGLISH_TEMPLATES,
            "fr", FRENCH_TEMPLATES,
            "de", GERMAN_TEMPLATES);

    /** The link text per language, for the three pages an answer can come from. */
    private static final Map<String, Map<String, String>> SOURCE_TITLES = Map.of(
            "nl-BE", Map.of("location", "Locatie en openingstijden", "collection", "De collectie",
                    "gallery", "Over de galerie"),
            "nl-NL", Map.of("location", "Locatie en openingstijden", "collection", "De collectie",
                    "gallery", "Over de galerie"),
            "en", Map.of("location", "Location and opening hours", "collection", "The collection",
                    "gallery", "About the gallery"),
            "fr", Map.of("location", "Emplacement et horaires", "collection", "La collection",
                    "gallery", "À propos de la galerie"),
            "de", Map.of("location", "Standort und Öffnungszeiten", "collection", "Die Kollektion",
                    "gallery", "Über die Galerie"));

    /** Sentence fragments that are not topics of their own but build the location answer. */
    private static final String LOCATION_AT = "locationat";
    private static final String OPEN_HOURS = "openhours";

    /**
     * The reply for a topic, in the visitor's language, assembled from the gallery's own facts.
     *
     * <p>The location answer is built from the parts the gallery has actually filled in, so a record
     * without opening hours does not produce a sentence about opening hours with nothing in it, and a
     * record without both falls back to the honest "not in our own records" reply.
     */
    static String answer(String language, Topic topic, Facts facts) {
        if (topic == Topic.LOCATION) {
            List<String> parts = new java.util.ArrayList<>();
            if (!facts.address().isBlank()) parts.add(template(language, LOCATION_AT).formatted(facts.address()));
            if (!facts.openingHours().isBlank()) parts.add(template(language, OPEN_HOURS).formatted(facts.openingHours()));
            return parts.isEmpty() ? template(language, "fallback") : String.join(" ", parts);
        }
        if (topic == Topic.COLLECTION_COUNT || topic == Topic.COLLECTION) {
            return template(language, topic).formatted(facts.pieces(), pieceNoun(language, facts.pieces()));
        }
        return template(language, topic);
    }

    /** The noun for the number of pieces, singular or plural, in the visitor's language. */
    static String pieceNoun(String language, long pieces) {
        boolean one = pieces == 1;
        return switch (language) {
            case "en" -> one ? "piece" : "pieces";
            case "fr" -> one ? "piece" : "pieces";
            case "de" -> one ? "Stück" : "Stücke";
            default -> one ? "stuk" : "stukken";
        };
    }

    /** The reply for one phrase, in the visitor's language, falling back to the gallery's own. */
    static String template(String language, Topic topic) {
        return template(language, topic.name().toLowerCase(Locale.ROOT));
    }

    static String template(String language, String phrase) {
        Map<String, String> requested = TEMPLATES.get(language);
        Map<String, String> texts = requested == null ? TEMPLATES.get(DEFAULT_LANGUAGE) : requested;
        return texts.getOrDefault(phrase, TEMPLATES.get(DEFAULT_LANGUAGE).getOrDefault(phrase, ""));
    }

    /**
     * The links shown under a reply: the pages the answer came from, or WhatsApp for anything the
     * gallery's records do not answer - the one place a question can actually be taken further.
     */
    static List<ChatSource> sourcesFor(String language, Topic topic) {
        return switch (topic) {
            case LOCATION -> List.of(new ChatSource(sourceTitle(language, "location"), "/map"));
            case COLLECTION_COUNT, COLLECTION -> List.of(new ChatSource(sourceTitle(language, "collection"), "/antiques"));
            case GALLERY -> List.of(new ChatSource(sourceTitle(language, "gallery"), "/about"));
            case FALLBACK -> List.of(whatsappSource());
            default -> List.of();
        };
    }

    /**
     * The link text, in the visitor's language. It is not a translated string on the frontend because
     * the API decides which page an answer came from, and the link has to name that page.
     */
    static String sourceTitle(String language, String page) {
        Map<String, String> titles = SOURCE_TITLES.getOrDefault(language, SOURCE_TITLES.get(DEFAULT_LANGUAGE));
        return titles.getOrDefault(page, page);
    }

    /** The words of a text, without accents and in lower case, so "Waar" and "waar" are one word. */
    private static String[] words(String text) {
        String plain = Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
        return java.util.Arrays.stream(plain.split("[^a-z0-9]+")).filter(word -> !word.isBlank())
                .toArray(String[]::new);
    }
}
