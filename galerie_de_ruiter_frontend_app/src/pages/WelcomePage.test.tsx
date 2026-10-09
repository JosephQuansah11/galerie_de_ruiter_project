import { screen } from "@testing-library/react";
import { flushPromises, renderPage } from "../../test/renderPage";
import i18n from "../i18n";
import WelcomePage from "./WelcomePage";

describe("WelcomePage", () => {
  it("presents the gallery introduction to visitors", async () => {
    renderPage(<WelcomePage />);
    await flushPromises();

    expect(screen.getByRole("heading", { level: 1, name: i18n.t("welcomeTitle") })).toBeInTheDocument();
    expect(screen.getByText(i18n.t("welcomeIntro"))).toBeInTheDocument();
  });

  it("links to the collection and to the gallery chat", async () => {
    renderPage(<WelcomePage />);
    await flushPromises();

    expect(screen.getByRole("link", { name: new RegExp(i18n.t("explore"), "i") })).toHaveAttribute("href", "/antiques");
    expect(screen.getByRole("link", { name: new RegExp(i18n.t("talkToGallery"), "i") })).toHaveAttribute("href", "/dashboard/chat");
  });

  it("describes the philosophy, the pop-up shop and the gallery story", async () => {
    renderPage(<WelcomePage />);
    await flushPromises();

    expect(screen.getByText(i18n.t("curiosityOverClutter"))).toBeInTheDocument();
    expect(screen.getByText(i18n.t("meetCollection"))).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: i18n.t("welcomeStoryTitle") })).toBeInTheDocument();
    expect(screen.getByText(i18n.t("welcomeStoryParagraph1"))).toBeInTheDocument();
  });
});
