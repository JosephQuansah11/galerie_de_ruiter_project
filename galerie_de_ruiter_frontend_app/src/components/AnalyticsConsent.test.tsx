import { fireEvent, screen } from "@testing-library/react";
import { renderPage } from "../../test/renderPage";
import i18n from "../i18n";
import { AnalyticsConsent } from "./AnalyticsConsent";

const mockAnalytics = {
  available: jest.fn(),
  choice: jest.fn(),
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

describe("analytics consent banner", () => {
  it("asks a first-time visitor before anything is loaded", () => {
    renderPage(<AnalyticsConsent />, { auth: false });

    expect(screen.getByText(i18n.t("analyticsConsentTitle"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("analyticsAccept") })).toBeInTheDocument();
  });

  it("does not ask again once the visitor answered", () => {
    mockAnalytics.choice.mockReturnValue("granted");

    renderPage(<AnalyticsConsent />, { auth: false });

    expect(screen.queryByText(i18n.t("analyticsConsentTitle"))).not.toBeInTheDocument();
  });

  it("records a yes and gets out of the way", () => {
    renderPage(<AnalyticsConsent />, { auth: false });

    fireEvent.click(screen.getByRole("button", { name: i18n.t("analyticsAccept") }));

    expect(mockAnalytics.grant).toHaveBeenCalled();
    expect(screen.queryByText(i18n.t("analyticsConsentTitle"))).not.toBeInTheDocument();
  });

  it("records a no and gets out of the way", () => {
    renderPage(<AnalyticsConsent />, { auth: false });

    fireEvent.click(screen.getByRole("button", { name: i18n.t("analyticsDecline") }));

    expect(mockAnalytics.deny).toHaveBeenCalled();
    expect(screen.queryByText(i18n.t("analyticsConsentTitle"))).not.toBeInTheDocument();
  });

  it("stays quiet where analytics is not offered at all", () => {
    mockAnalytics.available.mockReturnValue(false);

    renderPage(<AnalyticsConsent />, { auth: false });

    expect(screen.queryByText(i18n.t("analyticsConsentTitle"))).not.toBeInTheDocument();
  });
});