import { screen } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import AdminInterestsPage from "./AdminInterestsPage";
import { getAdminInterests } from "@/apis/backend_api";

jest.mock("@/apis/backend_api", () => ({
  getAdminInterests: jest.fn(),
}));

const mockedInterests = getAdminInterests as jest.Mock;

beforeEach(() => {
  mockedInterests.mockResolvedValue([{
    antiqueId: "piece-1",
    title: "Carved walnut mirror",
    artist: "Ada Lovelace",
    category: "Mirrors",
    imageUrl: null,
    people: [{
      userId: "user-1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      addedAt: "2026-10-01T10:00:00Z",
    }],
  }]);
});

describe("the interested visitors page", () => {
  it("shows what a visitor wants and how to contact them", async () => {
    renderPage(<AdminInterestsPage />, { route: "/admin/interests" });

    expect(await screen.findByRole("heading", { name: "Carved walnut mirror" })).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ada@example.com/i })).toHaveAttribute(
      "href", "mailto:ada@example.com",
    );
    expect(screen.getByRole("link", { name: i18n.t("viewPiece") })).toHaveAttribute(
      "href", "/antiques/piece-1",
    );
  });

  it("explains when nobody has marked a piece", async () => {
    mockedInterests.mockResolvedValue([]);
    renderPage(<AdminInterestsPage />, { route: "/admin/interests" });

    expect(await screen.findByText(i18n.t("adminInterestsEmpty"))).toBeInTheDocument();
  });
});
