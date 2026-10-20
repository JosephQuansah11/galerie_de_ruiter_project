package be.galerie_de_ruiter.project.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Rejects a text with more whitespace-separated words than {@link #value()}. A description is
 * limited by words rather than characters, so a note with long words or punctuation is not
 * rejected for a reason the curator cannot see.
 */
@Documented
@Constraint(validatedBy = MaxWordsValidator.class)
@Target({ElementType.METHOD, ElementType.FIELD, ElementType.ANNOTATION_TYPE,
        ElementType.CONSTRUCTOR, ElementType.PARAMETER, ElementType.TYPE_USE})
@Retention(RetentionPolicy.RUNTIME)
public @interface MaxWords {
    int value();

    String message() default "must have at most {value} words";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
