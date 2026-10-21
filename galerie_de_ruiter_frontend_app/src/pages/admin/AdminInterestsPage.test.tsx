import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import AdminInterestsPage from "./AdminInterestsPage";
import { getAdminInterests, setAntiqueSold } from "@/apis/backend_api";

jest.mock("@/apis/backend_api", () => ({
  getAdminInterests: jest.fn(),
  setAntiqueSold: jest.fn(),
}));

const mockedInterests = getAdminInterests as jest.Mock;
const mockedSold = setAntiqueSold as jest.Mock;

const groups = [
  {
    antiqueId: "piece-1",
    title: "Carved walnut mirror",
    artist: "Ada Lovelace",
    category: "Mirrors",
    imageUrl: null,
    sold: false,
    people: [{
      userId: "user-1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      addedAt: "2026-10-01T10:00:00Z",
    }],
  },
  {
    antiqueId: "piece-2",
    title: "Brass reading lamp",
    artist: "Grace Hopper",
    category: "Lighting",
    imageUrl: null,
    sold: true,
    people: [{
      userId: "user-2",
      name: "Grace Hopper",
      email: "grace@example.com",
      addedAt: "2026-10-02T10:00:00Z",
    }],
  },
];

beforeEach(() => {
  mockedInterests.mockResolvedValue(groups);
  mockedSold.mockResolvedValue({ id: "piece-1", sold: true });
  jest.spyOn(window, "confirm").mockReturnValue(true);
});

describe("the interested visitors page", () => {
  it("shows what a visitor wants and how to contact them", async () => {
    renderPage(<AdminInterestsPage />, { route: "/admin/interests" });

    expect(await screen.findByRole("heading", { name: "Carved walnut mirror" })).toBeInTheDocument();
    const mirror = screen.getByRole("heading", { name: "Carved walnut mirror" }).closest("section");
    expect(mirror).not.toBeNull();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ada@example.com/i })).toHaveAttribute(
      "href", "mailto:ada@example.com",
    );
    expect(within(mirror as HTMLElement).getByRole("link", { name: i18n.t("viewPiece") })).toHaveAttribute(
      "href", "/antiques/piece-1",
    );
  });

  it("searches by visitor name or piece title", async () => {
    renderPage(<AdminInterestsPage />, { route: "/admin/interests" });
    await screen.findByRole("heading", { name: "Carved walnut mirror" });
    const search = screen.getByRole("searchbox", { name: i18n.t("searchInterests") });

    fireEvent.change(search, { target: { value: "grace" } });
    expect(screen.getByRole("heading", { name: "Brass reading lamp" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Carved walnut mirror" })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "walnut" } });
    expect(screen.getByRole("heading", { name: "Carved walnut mirror" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Brass reading lamp" })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "nobody" } });
    expect(screen.getByText(i18n.t("noInterestsFound", { query: "nobody" }))).toBeInTheDocument();
  });

  it("marks an interested piece sold", async () => {
    renderPage(<AdminInterestsPage />, { route: "/admin/interests" });
    const mirror = (await screen.findByRole("heading", { name: "Carved walnut mirror" })).closest("section");
    expect(mirror).not.toBeNull();

    fireEvent.click(within(mirror as HTMLElement).getByRole("button", { name: i18n.t("markInterestSold") }));

    await waitFor(() => expect(mockedSold).toHaveBeenCalledWith("piece-1", true));
    expect(within(mirror as HTMLElement).getByText(i18n.t("sold"))).toBeInTheDocument();
  });

  it("explains when nobody has marked a piece", async () => {
    mockedInterests.mockResolvedValue([]);
    renderPage(<AdminInterestsPage />, { route: "/admin/interests" });

    expect(await screen.findByText(i18n.t("adminInterestsEmpty"))).toBeInTheDocument();
  });
});
