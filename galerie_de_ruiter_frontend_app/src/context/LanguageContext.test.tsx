import { render, screen } from "@testing-library/react";
import { DEFAULT_LANGUAGE, LanguageProvider, useLanguage } from "./LanguageContext";

function LanguageProbe() {
  const { language } = useLanguage();
  return <span data-testid="language">{language}</span>;
}

describe("gallery language", () => {
  it("defaults to Belgian Dutch for a first-time visitor", () => {
    localStorage.removeItem("galerie-language");

    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);

    expect(DEFAULT_LANGUAGE).toBe("nl-BE");
    expect(screen.getByTestId("language")).toHaveTextContent("nl-BE");
  });

  it("keeps a language the visitor already chose", () => {
    localStorage.setItem("galerie-language", "fr");

    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);

    expect(screen.getByTestId("language")).toHaveTextContent("fr");
  });
});
