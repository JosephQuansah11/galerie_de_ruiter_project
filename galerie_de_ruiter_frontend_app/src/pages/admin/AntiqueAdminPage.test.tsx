import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import AntiqueAdminPage from "./AntiqueAdminPage";
import { deleteAntique, deleteAntiqueImage, getAllAntiques, getImageFormatStatus, convertImagesToWebp, reorderAntiqueImages, setAntiqueSold, updateAntique } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";

jest.mock("@/apis/backend_api", () => ({
  getAllAntiques: jest.fn(),
  updateAntique: jest.fn(),
  deleteAntique: jest.fn(),
  deleteAntiqueImage: jest.fn(),
  reorderAntiqueImages: jest.fn(),
  uploadAntiqueImage: jest.fn(),
  uploadAntiqueModel: jest.fn(),
  setAntiqueSold: jest.fn(),
  getImageFormatStatus: jest.fn(),
  convertImagesToWebp: jest.fn(),
}));

const mockedAntiques = getAllAntiques as jest.Mock;
const mockedDelete = deleteAntique as jest.Mock;
const mockedSold = setAntiqueSold as jest.Mock;
const mockedUpdate = updateAntique as jest.Mock;
const mockedDeleteImage = deleteAntiqueImage as jest.Mock;
const mockedReorder = reorderAntiqueImages as jest.Mock;
const mockedImageFormat = getImageFormatStatus as jest.Mock;
const mockedConvert = convertImagesToWebp as jest.Mock;

/** Mirrors an axios HTTP failure so the page's status handling can be exercised. */
function httpError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status, data: { detail: "rejected by the server" } },
  });
}

const inventory: Antique[] = [
  { id: "1", title: "Carved walnut mirror", category: "Mirrors", description: "Late 19th century", price: 480 },
  { id: "2", title: "Brass reading lamp", category: null, description: "Art deco", price: null },
];

beforeEach(() => {
  mockedAntiques.mockResolvedValue(inventory);
  mockedDelete.mockResolvedValue(undefined);
  mockedUpdate.mockResolvedValue(inventory[0]);
  mockedDeleteImage.mockResolvedValue(undefined);
  mockedReorder.mockResolvedValue(undefined);
  mockedImageFormat.mockResolvedValue({ webpEncoder: true, total: 2, webp: 2, candidates: 0 });
  jest.spyOn(window, "confirm").mockReturnValue(true);
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("Antique administration page", () => {
  it("lists the inventory with its categories and prices", async () => {
    renderPage(<AntiqueAdminPage />);

    expect(await screen.findByText("Carved walnut mirror")).toBeInTheDocument();
    expect(screen.getByText("Brass reading lamp")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(i18n.t("uncategorized")))).toBeInTheDocument();
  });

  it("offers the folder import beside the single-piece form", async () => {
    renderPage(<AntiqueAdminPage />);

    expect(await screen.findByRole("link", { name: i18n.t("importFolder") }))
      .toHaveAttribute("href", "/admin/antiques/import");
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

  it("names a refused delete instead of blaming the whole action", async () => {
    mockedDelete.mockRejectedValueOnce(httpError(403));

    renderPage(<AntiqueAdminPage />);
    await screen.findByText("Carved walnut mirror");

    fireEvent.click(screen.getByRole("button", { name: `${i18n.t("deleteAntique")}: Carved walnut mirror` }));

    expect(await screen.findByText(i18n.t("antiqueSavePermissionError"))).toBeInTheDocument();
    expect(screen.getByText("Carved walnut mirror")).toBeInTheDocument();
  });

  it("records a piece as sold once the payment is agreed", async () => {
    mockedSold.mockResolvedValue({ ...inventory[0], sold: true });

    renderPage(<AntiqueAdminPage />);
    await screen.findByText("Carved walnut mirror");

    fireEvent.click(screen.getByRole("button", { name: `${i18n.t("markSold")}: Carved walnut mirror` }));

    await waitFor(() => expect(mockedSold).toHaveBeenCalledWith("1", true));
    expect(await screen.findByText(i18n.t("sold"))).toBeInTheDocument();
  });

  it("puts a sold piece back on offer", async () => {
    mockedAntiques.mockResolvedValueOnce([{ ...inventory[0], sold: true }]);
    mockedSold.mockResolvedValue({ ...inventory[0], sold: false });

    renderPage(<AntiqueAdminPage />);
    await screen.findByText("Carved walnut mirror");

    fireEvent.click(screen.getByRole("button", { name: `${i18n.t("markAvailable")}: Carved walnut mirror` }));

    await waitFor(() => expect(mockedSold).toHaveBeenCalledWith("1", false));
  });

  it("removes a photograph from a piece when the editor saves", async () => {
    mockedAntiques.mockResolvedValueOnce([{ ...inventory[0], imageUrls: ["/api/antiques/1/image/aaa"] }]);

    renderPage(<AntiqueAdminPage />);
    await screen.findByText("Carved walnut mirror");

    fireEvent.click(screen.getByRole("button", { name: `${i18n.t("editAntique")}: Carved walnut mirror` }));
    // The stored photograph appears in the dialog and can be dropped before saving.
    fireEvent.click(await screen.findByRole("button", { name: i18n.t("removeImageNumber", { number: 1 }) }));
    fireEvent.click(screen.getByRole("button", { name: i18n.t("saveAntique") }));

    await waitFor(() => expect(mockedDeleteImage).toHaveBeenCalledWith("1", "aaa"));
  });

  it("stores the photograph order the editor shows", async () => {
    mockedAntiques.mockResolvedValueOnce([
      { ...inventory[0], imageUrls: ["/api/antiques/1/image/aaa", "/api/antiques/1/image/bbb"] },
    ]);

    renderPage(<AntiqueAdminPage />);
    await screen.findByText("Carved walnut mirror");

    fireEvent.click(screen.getByRole("button", { name: `${i18n.t("editAntique")}: Carved walnut mirror` }));
    // Move the second photograph to the front; it becomes the piece's main image.
    fireEvent.click(await screen.findByRole("button", { name: i18n.t("moveImageEarlier", { number: 2 }) }));
    fireEvent.click(screen.getByRole("button", { name: i18n.t("saveAntique") }));

    await waitFor(() => expect(mockedReorder).toHaveBeenCalledWith("1", ["bbb", "aaa"]));
  });

  it("converts the catalogue's older photographs after the admin confirms", async () => {
    mockedImageFormat.mockResolvedValue({ webpEncoder: true, total: 5, webp: 2, candidates: 3 });
    mockedConvert.mockResolvedValue({
      dryRun: false, total: 5, webp: 5, candidates: 0, converted: 3,
      bytesBefore: 3_000_000, bytesAfter: 1_000_000, failed: [],
    });

    renderPage(<AntiqueAdminPage />);
    await screen.findByText(i18n.t("imageFormatStatus", { webp: 2, total: 5 }));

    fireEvent.click(screen.getByRole("button", { name: i18n.t("imageFormatConvert") }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: i18n.t("imageFormatConvert") }));

    await waitFor(() => expect(mockedConvert).toHaveBeenCalledWith(true, 25));
    expect(await screen.findByText(/3 photograph\(s\) converted/)).toBeInTheDocument();
  });

  it("says so when every photograph is already WebP", async () => {
    renderPage(<AntiqueAdminPage />);

    expect(await screen.findByText(i18n.t("imageFormatAllDone"))).toBeInTheDocument();
  });
});
