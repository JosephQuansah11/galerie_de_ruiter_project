package be.galerie_de_ruiter.project.validation;

/** Limits shared by the antique create and update requests. */
public final class DescriptionLimits {
    /** A gallery note may be long, but not a book of its own. */
    public static final int MAX_WORDS = 5000;

    private DescriptionLimits() {
    }
}
