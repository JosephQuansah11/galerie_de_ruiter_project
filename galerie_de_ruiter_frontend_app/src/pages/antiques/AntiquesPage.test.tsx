import { fireEvent, screen } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import AntiquesPage from "./AntiquesPage";
import { getAllAntiques, getVisibleCategories } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";

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

beforeEach(() => {
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

  it("reports a failing catalogue request", async () => {
    mockedAntiques.mockRejectedValueOnce(new Error("network down"));

    renderPage(<AntiquesPage />, { shopping: true });

    expect(await screen.findByText(i18n.t("collectionLoadError"))).toBeInTheDocument();
  });
});
