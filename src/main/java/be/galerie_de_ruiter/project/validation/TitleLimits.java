package be.galerie_de_ruiter.project.validation;

/** Limits shared by the antique create requests. */
public final class TitleLimits {
    /** A title is a short name for the piece, not a description. */
    public static final int MAX_WORDS = 10;

    private TitleLimits() {
    }
}
