import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import AntiqueFolderImportPage from "./AntiqueFolderImportPage";
import { addAntique, getVisibleCategories, searchDesigners, uploadAntiqueImage } from "@/apis/backend_api";
import type { Category } from "@/models/antiques/Antique";

jest.mock("@/apis/backend_api", () => ({
  addAntique: jest.fn(),
  uploadAntiqueImage: jest.fn(),
  searchDesigners: jest.fn(),
  createDesigner: jest.fn(),
  getVisibleCategories: jest.fn(),
}));
jest.mock("@/services/contentUpdates", () => ({ publishContentUpdate: jest.fn() }));

const addAntiqueMock = addAntique as jest.Mock;
const uploadImageMock = uploadAntiqueImage as jest.Mock;
const searchDesignersMock = searchDesigners as jest.Mock;
const getCategoriesMock = getVisibleCategories as jest.Mock;

const artist = { id: "artist-1", firstName: "Ada", lastName: "Lovelace" };

const categories: Category[] = [
  {
    id: "cat-mirrors", name: "Mirrors", visible: true, itemCount: 2,
    children: [{ id: "cat-wall", name: "Wall mirrors", visible: true, itemCount: 1, children: [] }],
  },
  { id: "cat-lighting", name: "Lighting", visible: true, itemCount: 1, children: [] },
];

function image(path: string): File {
  const file = new File([new Uint8Array(1)], path.split("/").pop() ?? path, { type: "image/jpeg" });
  Object.defineProperty(file, "webkitRelativePath", { value: path });
  return file;
}

function csv(path: string, text: string): File {
  const file = new File([text], path.split("/").pop() ?? path, { type: "text/csv" });
  Object.defineProperty(file, "webkitRelativePath", { value: path });
  // jsdom's File does not always expose Blob.arrayBuffer; the import reads the bytes itself so a
  // Windows-1252 file can fall back when the UTF-8 decode finds replacement characters.
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new TextEncoder().encode(text).buffer,
  });
  return file;
}

function fileList(files: File[]): FileList {
  const list = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    [Symbol.iterator]: () => files[Symbol.iterator](),
  } as unknown as FileList;
  files.forEach((file, index) => { (list as unknown as Record<number, File>)[index] = file; });
  return list;
}

const folder = [
  image("Root/Mirrors/Carved mirror/front.jpg"),
  image("Root/Mirrors/Carved mirror/back.jpg"),
  image("Root/Lamps/Brass lamp/1.jpg"),
  csv("Root/pieces.csv", "file;title;description;price\n"
    + "Mirrors/Carved mirror;Carved mirror;Late 19th;480,50\n"
    + "Lamps/Brass lamp;Brass lamp;Art deco;1.250,00\n"),
];

async function chooseFolder(files = folder): Promise<void> {
  const picker = screen.getByLabelText(i18n.t("chooseFolder"));
  fireEvent.change(picker, { target: { files: fileList(files) } });
  await screen.findByDisplayValue("Carved mirror");
}

async function assignArtist(): Promise<void> {
  fireEvent.change(screen.getByPlaceholderText(i18n.t("searchByArtist")), { target: { value: "Ada" } });
  fireEvent.click(await screen.findByRole("button", { name: "Ada Lovelace" }));
}

async function assignCategory(categoryId = "cat-mirrors"): Promise<void> {
  // The picker renders without options until the category request has answered.
  await screen.findAllByRole("option", { name: "Mirrors" });
  fireEvent.change(screen.getByLabelText(i18n.t("chooseCategory")), { target: { value: categoryId } });
  fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("assignCategoryAction"), "i") }));
}

beforeEach(() => {
  searchDesignersMock.mockResolvedValue([artist]);
  getCategoriesMock.mockResolvedValue(categories);
  addAntiqueMock.mockImplementation(async () => ({ id: `antique-${addAntiqueMock.mock.calls.length}` }));
  uploadImageMock.mockResolvedValue({ id: "image-1", url: "/api/antiques/1/image/1" });
});

describe("the folder import screen", () => {
  it("matches the CSV to nested folders and shows the titles and prices", async () => {
    renderPage(<AntiqueFolderImportPage />);
    await chooseFolder();

    expect(screen.getByDisplayValue("Carved mirror")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Brass lamp")).toBeInTheDocument();
    expect(screen.getByDisplayValue("480.5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1250")).toBeInTheDocument();
    expect(screen.getAllByText(i18n.t("csvMatched"))).toHaveLength(2);
  });

  it("matches a CSV chosen separately from the image folder", async () => {
    const imagesOnly = folder.filter((file) => file.type.startsWith("image/"));
    renderPage(<AntiqueFolderImportPage />);
    await chooseFolder(imagesOnly);

    // The folder names give the rows provisional titles; the prices wait for the CSV.
    expect(screen.getByDisplayValue("Carved mirror")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("480.5")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(i18n.t("chooseCsvFiles")), {
      target: {
        files: fileList([csv("Root/pieces.csv", "file;title;description;price\n"
          + "Mirrors/Carved mirror;Carved mirror;Late 19th;480,50\n"
          + "Lamps/Brass lamp;Brass lamp;Art deco;1.250,00\n")]),
      },
    });

    expect(await screen.findByDisplayValue("480.5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1250")).toBeInTheDocument();
    expect(screen.getAllByText(i18n.t("csvMatched"))).toHaveLength(2);
  });

  it("keeps a separately chosen CSV when the image folder is chosen afterwards", async () => {
    const imagesOnly = folder.filter((file) => file.type.startsWith("image/"));
    renderPage(<AntiqueFolderImportPage />);

    fireEvent.change(screen.getByLabelText(i18n.t("chooseCsvFiles")), {
      target: {
        files: fileList([csv("Root/pieces.csv", "file;title;description;price\n"
          + "Mirrors/Carved mirror;Carved mirror;Late 19th;480,50\n"
          + "Lamps/Brass lamp;Brass lamp;Art deco;1.250,00\n")]),
      },
    });

    await chooseFolder(imagesOnly);

    expect(await screen.findByDisplayValue("480.5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1250")).toBeInTheDocument();
  });

  it("assigns one artist and one category to the selected pieces and creates them with all their photographs", async () => {
    renderPage(<AntiqueFolderImportPage />);
    await chooseFolder();
    await assignArtist();
    await assignCategory();

    // Both rows were selected by default, so choosing the artist and the category filled both.
    expect(screen.getAllByText("Ada Lovelace")).toHaveLength(2);
    const importButton = screen.getByRole("button", { name: /Import 2 piece/ });
    expect(importButton).toBeEnabled();
    fireEvent.click(importButton);

    await waitFor(() => expect(addAntiqueMock).toHaveBeenCalledTimes(2));
    expect(addAntiqueMock.mock.calls.map(([piece]) => piece)).toEqual([
      expect.objectContaining({ title: "Brass lamp", artistId: "artist-1", categoryId: "cat-mirrors", description: "Art deco", price: 1250 }),
      expect.objectContaining({ title: "Carved mirror", artistId: "artist-1", categoryId: "cat-mirrors", description: "Late 19th", price: 480.5 }),
    ]);
    expect(uploadImageMock).toHaveBeenCalledTimes(3);
    expect(await screen.findByText(/2 piece\(s\) imported/)).toBeInTheDocument();
  });

  it("will not import until every selected piece has an artist", async () => {
    renderPage(<AntiqueFolderImportPage />);
    await chooseFolder();

    expect(screen.getByRole("button", { name: /Import 2 piece/ })).toBeDisabled();
    expect(screen.getByText(i18n.t("importNeedsArtist"))).toBeInTheDocument();
  });

  it("will not import until every selected piece has a category", async () => {
    renderPage(<AntiqueFolderImportPage />);
    await chooseFolder();
    await assignArtist();

    expect(screen.getByRole("button", { name: /Import 2 piece/ })).toBeDisabled();
    expect(screen.getByText(i18n.t("importNeedsCategory"))).toBeInTheDocument();
  });

  it("pre-fills each piece from a category column in the CSV", async () => {
    const withCategories = [
      image("Root/Mirrors/Carved mirror/front.jpg"),
      image("Root/Lamps/Brass lamp/1.jpg"),
      csv("Root/pieces.csv", "file;title;description;price;category\n"
        + "Mirrors/Carved mirror;Carved mirror;Late 19th;480;Mirrors\n"
        + "Lamps/Brass lamp;Brass lamp;Art deco;1250;Lighting\n"),
    ];

    renderPage(<AntiqueFolderImportPage />);
    await chooseFolder(withCategories);

    await waitFor(() => expect(screen.getByLabelText(`${i18n.t("category")}: Carved mirror`)).toHaveValue("cat-mirrors"));
    await waitFor(() => expect(screen.getByLabelText(`${i18n.t("category")}: Brass lamp`)).toHaveValue("cat-lighting"));

    await assignArtist();
    fireEvent.click(screen.getByRole("button", { name: /Import 2 piece/ }));

    await waitFor(() => expect(addAntiqueMock).toHaveBeenCalledTimes(2));
    expect(addAntiqueMock.mock.calls.map(([piece]) => piece.categoryId)).toEqual(["cat-lighting", "cat-mirrors"]);
  });
});
