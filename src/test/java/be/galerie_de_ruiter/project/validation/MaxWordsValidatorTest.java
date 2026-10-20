package be.galerie_de_ruiter.project.validation;

import static org.assertj.core.api.Assertions.assertThat;

import be.galerie_de_ruiter.project.dto.AntiqueRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** The API counts words, not characters, so a long gallery note is not rejected for its length. */
class MaxWordsValidatorTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsFiveThousandWords() {
        assertThat(validator.validate(request(words(DescriptionLimits.MAX_WORDS)))).isEmpty();
    }

    @Test
    void acceptsTenTitleWordsAndRejectsTheEleventh() {
        assertThat(validator.validate(withTitle(words(TitleLimits.MAX_WORDS)))).isEmpty();
        assertThat(validator.validate(withTitle(words(TitleLimits.MAX_WORDS + 1))))
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("title"));
    }

    @Test
    void rejectsTheNextWord() {
        var violations = validator.validate(request(words(DescriptionLimits.MAX_WORDS + 1)));

        assertThat(violations)
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("description"));
    }

    @Test
    void allowsAMissingDescription() {
        assertThat(validator.validate(request(null))).isEmpty();
    }

    @Test
    void countsRunsOfWhitespaceAsOneWord() {
        var note = new Note("  one\n\ntwo\tthree  ");

        assertThat(validator.validate(note)).isEmpty();
    }

    private static AntiqueRequest request(String description) {
        return new AntiqueRequest("Stoel", UUID.randomUUID(), description, BigDecimal.TEN, null, null, null);
    }

    private static AntiqueRequest withTitle(String title) {
        return new AntiqueRequest(title, UUID.randomUUID(), null, BigDecimal.TEN, null, null, null);
    }

    private static String words(int count) {
        return "word ".repeat(count).trim();
    }

    record Note(@MaxWords(3) String text) {
    }
}
