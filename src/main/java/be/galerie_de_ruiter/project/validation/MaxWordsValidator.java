package be.galerie_de_ruiter.project.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Counts runs of non-whitespace characters, matching how the import and the edit form count
 * words in the browser. A missing description is valid; the field is optional.
 */
public class MaxWordsValidator implements ConstraintValidator<MaxWords, CharSequence> {
    private int maxWords;

    @Override
    public void initialize(MaxWords annotation) {
        this.maxWords = annotation.value();
    }

    @Override
    public boolean isValid(CharSequence value, ConstraintValidatorContext context) {
        if (value == null) return true;
        int words = 0;
        boolean inWord = false;
        for (int i = 0; i < value.length(); i++) {
            if (Character.isWhitespace(value.charAt(i))) {
                inWord = false;
            } else if (!inWord) {
                words++;
                // Stop counting as soon as the limit is crossed; a pasted book should not
                // make the validator walk the rest of the text.
                if (words > maxWords) return false;
                inWord = true;
            }
        }
        return true;
    }
}
