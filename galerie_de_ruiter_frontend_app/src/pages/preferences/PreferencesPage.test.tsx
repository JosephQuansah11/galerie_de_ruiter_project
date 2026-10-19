import { fireEvent, screen, waitFor } from "@testing-library/react";
import { flushPromises, renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import { themes } from "@/context/themes";
import { PreferencesPage } from "./PreferencesPage";

const mockAnalytics = {
  available: jest.fn(() => true),
  choice: jest.fn((): "granted" | "denied" | null => null),
  grant: jest.fn(),
  deny: jest.fn(),
};

jest.mock("@/services/clarity", () => ({
  analyticsAvailable: () => mockAnalytics.available(),
  analyticsChoice: () => mockAnalytics.choice(),
  grantAnalytics: () => mockAnalytics.grant(),
  denyAnalytics: () => mockAnalytics.deny(),
}));

beforeEach(() => {
  mockAnalytics.available.mockReturnValue(true);
  mockAnalytics.choice.mockReturnValue(null);
});

afterEach(async () => {
  await i18n.changeLanguage("en");
  localStorage.clear();
  document.body.className = "";
  document.documentElement.removeAttribute("lang");
});

describe("Preferences page", () => {
  it("offers the gallery themes and the reading languages", async () => {
    renderPage(<PreferencesPage />);
    await flushPromises();

    expect(screen.getByRole("heading", { level: 1, name: i18n.t("preferencesTitle") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(i18n.t("themeDeepWine"), "i") })).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("chooseReadingLanguage"))).toBeInTheDocument();
  });

  it("applies the deep wine theme and can return to the default", async () => {
    renderPage(<PreferencesPage />);
    await flushPromises();

    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("themeDeepWine"), "i") }));
    await waitFor(() => expect(document.body.classList.contains("theme-dark")).toBe(true));

    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("reset"), "i") }));
    await waitFor(() => expect(document.body.classList.contains("theme-dark")).toBe(false));
  });

  it("remembers the chosen reading language", async () => {
    renderPage(<PreferencesPage />);
    await flushPromises();

    fireEvent.change(screen.getByLabelText(i18n.t("chooseReadingLanguage")), { target: { value: "fr" } });

    await waitFor(() => expect(document.documentElement.lang).toBe("fr-BE"));
    expect(localStorage.getItem("galerie-language")).toBe("fr");
  });

  it("marks the theme in use and moves the mark to the chosen palette", async () => {
    renderPage(<PreferencesPage />);
    await flushPromises();

    const wine = screen.getByRole("button", { name: new RegExp(i18n.t("themeWineWhite"), "i") });
    const deepWine = screen.getByRole("button", { name: new RegExp(i18n.t("themeDeepWine"), "i") });

    expect(wine).toHaveAttribute("aria-pressed", "true");
    expect(wine).toHaveTextContent(i18n.t("active"));
    expect(deepWine).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(deepWine);

    await waitFor(() => expect(deepWine).toHaveAttribute("aria-pressed", "true"));
    expect(wine).toHaveAttribute("aria-pressed", "false");
    expect(deepWine).toHaveTextContent(i18n.t("active"));
    expect(localStorage.getItem("selectedTheme")).toBe("dark");
  });

  it("offers the palettes the gallery added, and applies the one that is chosen", async () => {
    renderPage(<PreferencesPage />);
    await flushPromises();

    for (const key of ["themeGreyWhite", "themeBlueGold", "themeEarthGrey"]) {
      expect(screen.getByRole("button", { name: new RegExp(i18n.t(key), "i") })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("themeBlueGold"), "i") }));

    await waitFor(() => expect(localStorage.getItem("selectedTheme")).toBe("blueGold"));
    // The palette reaches the document as the variables every stylesheet reads.
    const root = document.documentElement.style;
    expect(root.getPropertyValue("--theme-primary")).toBe(themes.blueGold.colors.primary);
    expect(root.getPropertyValue("--theme-background")).toBe(themes.blueGold.colors.background);
    expect(root.getPropertyValue("--theme-nav-end")).toBe(themes.blueGold.colors.navEnd);
  });

  it("keeps the palette when the interface switches between light and dark", async () => {
    renderPage(<PreferencesPage />);
    await flushPromises();

    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("themeBlueGold"), "i") }));
    await waitFor(() => expect(localStorage.getItem("selectedTheme")).toBe("blueGold"));

    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("darkMode"), "i") }));

    // The dark form of the same palette, not another one.
    await waitFor(() => expect(localStorage.getItem("selectedTheme")).toBe("blueGoldDark"));
    expect(document.body.classList.contains("theme-dark")).toBe(true);
    expect(document.documentElement.style.getPropertyValue("--theme-background")).toBe(themes.blueGoldDark.colors.background);

    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("lightMode"), "i") }));

    await waitFor(() => expect(localStorage.getItem("selectedTheme")).toBe("blueGold"));
    expect(document.documentElement.style.getPropertyValue("--theme-background")).toBe(themes.blueGold.colors.background);
  });

  it("switches between the dark and light interface", async () => {
    renderPage(<PreferencesPage />);
    await flushPromises();

    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("darkMode"), "i") }));
    await waitFor(() => expect(document.body.classList.contains("theme-dark")).toBe(true));

    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("lightMode"), "i") }));
    await waitFor(() => expect(document.body.classList.contains("theme-dark")).toBe(false));
  });

  it("offers analytics where the visitor can change the answer", async () => {
    renderPage(<PreferencesPage />);
    await flushPromises();

    fireEvent.click(screen.getByRole("button", { name: i18n.t("analyticsTurnOn") }));

    expect(mockAnalytics.grant).toHaveBeenCalled();
  });

  it("turns analytics off again, which also clears its cookies", async () => {
    mockAnalytics.choice.mockReturnValue("granted");
    renderPage(<PreferencesPage />);
    await flushPromises();

    fireEvent.click(screen.getByRole("button", { name: i18n.t("analyticsTurnOff") }));

    expect(mockAnalytics.deny).toHaveBeenCalled();
  });

  it("hides the analytics card where analytics cannot run", async () => {
    mockAnalytics.available.mockReturnValue(false);
    renderPage(<PreferencesPage />);
    await flushPromises();

    expect(screen.queryByText(i18n.t("analyticsSettingsTitle"))).not.toBeInTheDocument();
  });
});
