import { screen } from "@testing-library/react";
import { flushPromises, renderPage } from "../../../test/renderPage";
import i18n from "@/i18n";
import DashboardPage from "./DashboardPage";
import { getGalleryStats } from "@/apis/backend_api";

jest.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children?: unknown }) => children,
  useAuth: () => ({ authenticated: true, loading: false, isAdmin: true }),
}));

jest.mock("@/apis/backend_api", () => ({
  ...jest.requireActual("@/apis/backend_api"),
  getGalleryStats: jest.fn(),
}));

const mockedStats = getGalleryStats as jest.Mock;

/**
 * The dashboard reads the gallery's own rows through the administrator-only stats endpoint, so
 * these pin what the gallery sees: the totals, the two charts and the per-collection breakdown.
 */
describe("DashboardPage", () => {
  it("shows what is sold, what is on offer and the interest over time", async () => {
    mockedStats.mockResolvedValue({
      totals: { antiques: 12, sold: 5, available: 7, views: 340, likes: 21 },
      categories: [
        { id: "c1", name: "Furniture", parentName: null, antiques: 8, sold: 3, available: 5, views: 210 },
        { id: "c2", name: "Mirrors", parentName: "Furniture", antiques: 4, sold: 2, available: 2, views: 130 },
      ],
      viewsPerDay: [{ day: "2026-01-01", count: 3 }, { day: "2026-01-02", count: 9 }],
      soldPerDay: [{ day: "2026-01-01", count: 0 }, { day: "2026-01-02", count: 1 }],
    });

    renderPage(<DashboardPage />, { auth: false });
    await flushPromises();

    expect(screen.getByRole("heading", { level: 1, name: i18n.t("dashboardHeading") })).toBeInTheDocument();
    // The five cards, in one assertion: "sold" is also a column header in the table below.
    const cards = document.querySelector(".dashboard-cards");
    expect(cards).toHaveTextContent("12");
    expect(cards).toHaveTextContent("5");
    expect(cards).toHaveTextContent("7");
    expect(cards).toHaveTextContent("340");
    expect(cards).toHaveTextContent("21");
    // The breakdown names a collection and the subcategory that sits under it.
    expect(screen.getByRole("rowheader", { name: /^Furniture$/ })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: /Mirrors/ })).toBeInTheDocument();
    // Both charts describe themselves, so a screen reader hears what the picture shows.
    expect(screen.getByRole("img", { name: i18n.t("viewsOverTime") })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: i18n.t("soldOverTime") })).toBeInTheDocument();
  });

  it("reports a failing stats request instead of showing empty numbers", async () => {
    mockedStats.mockRejectedValueOnce(new Error("forbidden"));

    renderPage(<DashboardPage />, { auth: false });
    await flushPromises();

    expect(await screen.findByText(i18n.t("statsLoadError"))).toBeInTheDocument();
  });
});
