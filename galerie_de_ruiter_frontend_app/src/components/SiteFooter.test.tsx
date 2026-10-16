import { screen, within } from "@testing-library/react";
import { renderPage } from "../../test/renderPage";
import i18n from "../i18n";
import { ProtectedLayout } from "../ProtectedLayout";
import { INSTAGRAM_URL, SiteFooter } from "./SiteFooter";

/**
 * The footer is part of the application shell, so rendering it is not the whole story: it has to
 * reach the pages. The first test drives the shell itself - the same one every route is drawn
 * inside - and the others drive the footer on its own.
 */
describe("the footer", () => {
  it("gives every page the gallery's Instagram profile", async () => {
    renderPage(<ProtectedLayout />);

    const footer = await screen.findByRole("contentinfo");
    const instagram = within(footer).getByRole("link", { name: i18n.t("footerInstagram") });
    expect(instagram).toHaveAttribute("href", INSTAGRAM_URL);
    // A new tab, and no referrer: the profile is someone else's site.
    expect(instagram).toHaveAttribute("target", "_blank");
    expect(instagram).toHaveAttribute("rel", "noreferrer");
  });

  it("names the pages a visitor can read without an account", () => {
    renderPage(<SiteFooter />);

    const links: [string, string][] = [
      ["/antiques", i18n.t("browseAntiques")],
      ["/chat", i18n.t("navGalleryChat")],
      ["/about", i18n.t("navAbout")],
      ["/map", i18n.t("location")],
    ];
    for (const [href, name] of links) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });

  it("closes with the year", () => {
    renderPage(<SiteFooter />);

    // The line is "© <year> Galerie de Ruiter", so the year is matched inside it.
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });
});
