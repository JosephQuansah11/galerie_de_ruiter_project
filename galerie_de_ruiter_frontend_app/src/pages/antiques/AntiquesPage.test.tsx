import { fireEvent, screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import AntiquesPage from "./AntiquesPage";
import { getAllAntiques, getVisibleCategories } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";

/**
 * The catalogue is open to a visitor without an account for its first page, so these tests drive
 * both halves: what an account buys (the paging controls, saving a piece, the basket) and what it
 * does not (the list itself).
 */
const mockAuth = { authenticated: true, isAdmin: false, loading: false };

jest.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children?: unknown }) => children,
  useAuth: () => mockAuth,
}));

jest.mock("@/apis/backend_api", () => ({
  getAllAntiques: jest.fn(),
  getVisibleCategories: jest.fn(),
  addAntique: jest.fn(),
}));

const mockedAntiques = getAllAntiques as jest.Mock;
const mockedCategories = getVisibleCategories as jest.Mock;

const pieces: Antique[] = [
  { id: "1", title: "Carved walnut mirror", category: "Mirrors", description: "Late 19th century", price: 480, artist: { displayName: "Atelier Bal" } },
  { id: "2", title: "Brass reading lamp", category: "Lighting", description: "Art deco", price: null },
];

/** Twenty pieces, so the collection runs past the twelve a page holds. */
const twenty = () => Array.from({ length: 20 }, (_, index) => ({
  id: `p${index}`, title: `Piece ${index + 1}`, category: null, description: "A piece", price: 10,
}));

beforeEach(() => {
  mockAuth.authenticated = true;
  mockAuth.isAdmin = false;
  mockAuth.loading = false;
  mockedAntiques.mockResolvedValue(pieces);
  mockedCategories.mockResolvedValue([
    { id: "c1", name: "Mirrors", visible: true, itemCount: 1, children: [] },
    { id: "c2", name: "Lighting", visible: true, itemCount: 1, children: [] },
  ]);
});

describe("Catalogue page", () => {
  it("shows every piece returned by the catalogue API", async () => {
    renderPage(<AntiquesPage />, { shopping: true });

    expect(await screen.findByText("Carved walnut mirror")).toBeInTheDocument();
    expect(screen.getByText("Brass reading lamp")).toBeInTheDocument();
    expect(screen.getByText("Atelier Bal")).toBeInTheDocument();
    expect(screen.getByText(i18n.t("priceOnRequest"))).toBeInTheDocument();
  });

  it("gives each card a real link a crawler can follow", async () => {
    renderPage(<AntiquesPage />, { shopping: true });

    expect(await screen.findByRole("link", { name: "Carved walnut mirror" })).toHaveAttribute("href", "/antiques/1");
    expect(screen.getByRole("link", { name: "Brass reading lamp" })).toHaveAttribute("href", "/antiques/2");
  });

  it("lays the collection out as a list of rows rather than grid tiles", async () => {
    renderPage(<AntiquesPage />, { shopping: true });
    await screen.findByText("Carved walnut mirror");

    expect(document.querySelector(".catalogue-list")).not.toBeNull();
    expect(document.querySelectorAll(".catalogue-row")).toHaveLength(2);
    // The Bootstrap grid markup the old card layout used is gone.
    expect(document.querySelector(".catalogue-list .row")).toBeNull();
  });

  it("shows only a short preview of a long description", async () => {
    const words = Array.from({ length: 80 }, (_, index) => `word${index + 1}`);
    mockedAntiques.mockResolvedValueOnce([
      { id: "3", title: "Long story", category: null, description: words.join(" "), price: 10 },
    ]);

    renderPage(<AntiquesPage />, { shopping: true });
    await screen.findByText("Long story");

    expect(screen.getByText(/word1 word2/)).toBeInTheDocument();
    expect(screen.queryByText(/word51/)).not.toBeInTheDocument();
  });

  it("pages the collection and lets the visitor choose how many pieces to see", async () => {
    const many = Array.from({ length: 20 }, (_, index) => ({
      id: `p${index}`, title: `Piece ${index + 1}`, category: null, description: "A piece", price: 10,
    }));
    mockedAntiques.mockResolvedValueOnce(many);

    renderPage(<AntiquesPage />, { shopping: true });
    await screen.findByText("Piece 1");

    // The default page holds twelve pieces of the twenty.
    expect(document.querySelectorAll(".catalogue-row")).toHaveLength(12);
    expect(screen.getByText(i18n.t("pageOf", { page: 1, pages: 2 }))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: i18n.t("nextPage") }));

    expect(document.querySelectorAll(".catalogue-row")).toHaveLength(8);
    expect(screen.getByText(i18n.t("pageOf", { page: 2, pages: 2 }))).toBeInTheDocument();

    // Choosing "all pieces" puts the whole collection back on one page.
    fireEvent.change(screen.getByLabelText(i18n.t("itemsPerPage")), { target: { value: "0" } });

    expect(document.querySelectorAll(".catalogue-row")).toHaveLength(20);
    expect(screen.queryByText(i18n.t("pageOf", { page: 1, pages: 1 }))).not.toBeInTheDocument();
  });

  it("filters pieces with the search control and clears the query again", async () => {
    renderPage(<AntiquesPage />, { shopping: true });
    await screen.findByText("Carved walnut mirror");

    const search = screen.getByLabelText(i18n.t("searchAntiques"));
    fireEvent.change(search, { target: { value: "brass" } });

    expect(screen.queryByText("Carved walnut mirror")).not.toBeInTheDocument();
    expect(screen.getByText("Brass reading lamp")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: i18n.t("clearSearch") }));

    expect(await screen.findByText("Carved walnut mirror")).toBeInTheDocument();
    expect(search).toHaveValue("");
  });

  it("hides the clear button while the search field is empty", async () => {
    renderPage(<AntiquesPage />, { shopping: true });
    await screen.findByText("Brass reading lamp");

    expect(screen.queryByRole("button", { name: i18n.t("clearSearch") })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("search") })).toBeInTheDocument();
  });

  it("explains an empty result instead of showing a blank page", async () => {
    renderPage(<AntiquesPage />, { shopping: true });
    await screen.findByText("Carved walnut mirror");

    fireEvent.change(screen.getByLabelText(i18n.t("searchAntiques")), { target: { value: "zzzz" } });

    expect(await screen.findByText(i18n.t("noPiecesMatch"))).toBeInTheDocument();
  });

  it("offers the available collection categories", async () => {
    renderPage(<AntiquesPage />, { shopping: true });

    expect(await screen.findByRole("button", { name: new RegExp(i18n.t("allPieces"), "i") })).toBeInTheDocument();
  });

  it("shows a subcategory's pieces when its main category is picked", async () => {
    mockedCategories.mockResolvedValueOnce([
      {
        id: "c1", name: "Audio - Tv", visible: true, itemCount: 0,
        children: [{ id: "c2", name: "Decoration", visible: true, parentId: "c1", parentName: "Audio - Tv", itemCount: 1, children: [] }],
      },
      { id: "c3", name: "Mirrors", visible: true, itemCount: 1, children: [] },
    ]);
    mockedAntiques.mockResolvedValueOnce([
      { id: "1", title: "Carved walnut mirror", category: "Mirrors", description: "Late 19th century", price: 480 },
      { id: "2", title: "Brass vase", category: "Audio - Tv / Decoration", description: "Art deco", price: 120 },
    ]);

    renderPage(<AntiquesPage />, { shopping: true });
    await screen.findByText("Carved walnut mirror");

    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("allPieces"), "i") }));
    fireEvent.click(await screen.findByRole("button", { name: /Audio - Tv/ }));

    // The piece filed under the subcategory belongs to the main category's branch…
    expect(screen.getByText("Brass vase")).toBeInTheDocument();
    // …and the rest of the collection is filtered out.
    expect(screen.queryByText("Carved walnut mirror")).not.toBeInTheDocument();
    // The heading reports what the filter found, not the whole collection.
    expect(document.querySelector(".catalogue-count strong")?.textContent).toBe("1");
  });

  it("reports a failing catalogue request", async () => {
    mockedAntiques.mockRejectedValueOnce(new Error("network down"));

    renderPage(<AntiquesPage />, { shopping: true });

    expect(await screen.findByText(i18n.t("collectionLoadError"))).toBeInTheDocument();
  });

  it("marks a sold piece and takes it off the shelf", async () => {
    mockedAntiques.mockResolvedValueOnce([
      { id: "9", title: "Gilded console", category: null, description: "Sold to a private collection", price: 1200, sold: true },
    ]);

    renderPage(<AntiquesPage />, { shopping: true });

    expect(await screen.findByText("Gilded console")).toBeInTheDocument();
    // Both the image overlay and the footer pill announce the piece as sold.
    expect(screen.getAllByText(i18n.t("sold")).length).toBeGreaterThan(1);
    expect(screen.queryByText(i18n.t("add"))).not.toBeInTheDocument();
  });

  it("gives a visitor the first page of the list, and an account for the rest of it", async () => {
    mockAuth.authenticated = false;
    const many = Array.from({ length: 20 }, (_, index) => ({
      id: `p${index}`, title: `Piece ${index + 1}`, category: null, description: "A piece", price: 10,
    }));
    mockedAntiques.mockResolvedValueOnce(many);

    renderPage(<AntiquesPage />, { shopping: true });
    await screen.findByText("Piece 1");

    // The first page of the list, and no controls that would go past it.
    expect(document.querySelectorAll(".catalogue-row")).toHaveLength(12);
    expect(screen.queryByLabelText(i18n.t("itemsPerPage"))).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.t("pageOf", { page: 1, pages: 2 }))).not.toBeInTheDocument();
    expect(screen.getByText(i18n.t("collectionSignInHint"))).toBeInTheDocument();
  });

  it("sends a visitor who tries to save a piece to the sign-in page", async () => {
    mockAuth.authenticated = false;

    renderPage(
      <Routes>
        <Route path="/antiques" element={<AntiquesPage />} />
        <Route path="/login" element={<p>the sign-in page</p>} />
      </Routes>,
      { shopping: true, route: "/antiques" },
    );
    await screen.findByText("Carved walnut mirror");

    fireEvent.click(screen.getAllByRole("button", { name: new RegExp(i18n.t("add"), "i") })[0]);

    expect(await screen.findByText("the sign-in page")).toBeInTheDocument();
  });

  it("gives an administrator the whole collection, like any other account", async () => {
    mockAuth.isAdmin = true;
    mockedAntiques.mockResolvedValueOnce(twenty());

    renderPage(<AntiquesPage />, { shopping: true });
    await screen.findByText("Piece 1");

    expect(document.querySelectorAll(".catalogue-row")).toHaveLength(12);
    expect(screen.getByText(i18n.t("pageOf", { page: 1, pages: 2 }))).toBeInTheDocument();
    expect(screen.queryByText(i18n.t("collectionSignInHint"))).not.toBeInTheDocument();
  });

  it("shows neither the paging controls nor the invitation while the account check runs", async () => {
    // The check decides which of the two belongs on screen; until it answers, neither does.
    mockAuth.loading = true;
    mockedAntiques.mockResolvedValueOnce(twenty());

    renderPage(<AntiquesPage />, { shopping: true });
    await screen.findByText("Piece 1");

    expect(screen.queryByLabelText(i18n.t("itemsPerPage"))).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.t("collectionSignInHint"))).not.toBeInTheDocument();
  });
});
