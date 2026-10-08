import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import AntiqueAdminPage from "./AntiqueAdminPage";
import { deleteAntique, getAllAntiques } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";

jest.mock("@/apis/backend_api", () => ({
  getAllAntiques: jest.fn(),
  updateAntique: jest.fn(),
  deleteAntique: jest.fn(),
  uploadAntiqueModel: jest.fn(),
}));

const mockedAntiques = getAllAntiques as jest.Mock;
const mockedDelete = deleteAntique as jest.Mock;

const inventory: Antique[] = [
  { id: "1", title: "Carved walnut mirror", category: "Mirrors", description: "Late 19th century", price: 480 },
  { id: "2", title: "Brass reading lamp", category: null, description: "Art deco", price: null },
];

beforeEach(() => {
  mockedAntiques.mockResolvedValue(inventory);
  mockedDelete.mockResolvedValue(undefined);
  jest.spyOn(window, "confirm").mockReturnValue(true);
});

describe("Antique administration page", () => {
  it("lists the inventory with its categories and prices", async () => {
    renderPage(<AntiqueAdminPage />);

    expect(await screen.findByText("Carved walnut mirror")).toBeInTheDocument();
    expect(screen.getByText("Brass reading lamp")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(i18n.t("uncategorized")))).toBeInTheDocument();
  });

  it("searches the inventory and clears the search again", async () => {
    renderPage(<AntiqueAdminPage />);
    await screen.findByText("Carved walnut mirror");

    const search = screen.getByPlaceholderText(i18n.t("searchInventory"));
    fireEvent.change(search, { target: { value: "mirror" } });

    expect(screen.queryByText("Brass reading lamp")).not.toBeInTheDocument();
    expect(screen.getByText("Carved walnut mirror")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: i18n.t("clearSearch") }));

    expect(await screen.findByText("Brass reading lamp")).toBeInTheDocument();
  });

  it("reports how many results match the search", async () => {
    renderPage(<AntiqueAdminPage />);
    await screen.findByText("Carved walnut mirror");

    fireEvent.change(screen.getByPlaceholderText(i18n.t("searchInventory")), { target: { value: "mirror" } });

    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("deletes a piece after the curator confirms", async () => {
    renderPage(<AntiqueAdminPage />);
    await screen.findByText("Carved walnut mirror");

    fireEvent.click(screen.getByRole("button", { name: `${i18n.t("deleteAntique")}: Carved walnut mirror` }));

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith("1"));
    await waitFor(() => expect(screen.queryByText("Carved walnut mirror")).not.toBeInTheDocument());
    expect(screen.getByText("Brass reading lamp")).toBeInTheDocument();
  });

  it("keeps the piece when the curator cancels the confirmation", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    renderPage(<AntiqueAdminPage />);
    await screen.findByText("Carved walnut mirror");

    fireEvent.click(screen.getByRole("button", { name: `${i18n.t("deleteAntique")}: Carved walnut mirror` }));

    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    expect(mockedDelete).not.toHaveBeenCalled();
    expect(screen.getByText("Carved walnut mirror")).toBeInTheDocument();
  });

  it("explains a failing inventory request", async () => {
    mockedAntiques.mockRejectedValueOnce(new Error("offline"));

    renderPage(<AntiqueAdminPage />);

    expect(await screen.findByText(i18n.t("antiquesCouldNotLoad"))).toBeInTheDocument();
  });
});
