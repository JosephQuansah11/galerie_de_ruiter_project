import { fireEvent, screen, waitFor } from "@testing-library/react";
import { flushPromises, renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import HomeAdminPage from "./HomeAdminPage";
import { getHomeContent, getHomeImages, deleteHomeImage, updateHomeContent, uploadHomeImage } from "@/apis/home_api";

jest.mock("@/apis/home_api", () => ({
  getHomeContent: jest.fn(),
  updateHomeContent: jest.fn(),
  getHomeImages: jest.fn().mockResolvedValue([]),
  uploadHomeImage: jest.fn(),
  deleteHomeImage: jest.fn(),
  resolveHomeImageUrl: (url: string) => url,
}));

const mockedGet = getHomeContent as jest.Mock;
const mockedUpdate = updateHomeContent as jest.Mock;
const mockedGetImages = getHomeImages as jest.Mock;
const mockedUpload = uploadHomeImage as jest.Mock;
const mockedDelete = deleteHomeImage as jest.Mock;

beforeEach(() => {
  mockedGetImages.mockResolvedValue([]);
  mockedGet.mockResolvedValue({
    heroTitle: "Objects with a past",
    heroIntro: "A slower way to discover beautiful things.",
    philosophyText: "Every piece is chosen by hand.",
    visitText: "Come and see the collection in Waasmunster.",
    storyParagraphs: "First paragraph.\nSecond paragraph.",
  });
  mockedUpdate.mockImplementation(async (content) => content);
});

describe("Dashboard page administration", () => {
  it("loads the copy the gallery has saved", async () => {
    renderPage(<HomeAdminPage />);
    await flushPromises();

    expect(screen.getByText(i18n.t("editHomePage"))).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(i18n.t("homeHeroTitle"))).toHaveValue("Objects with a past"));
    expect(screen.getByLabelText(i18n.t("homeStoryParagraphs"))).toHaveValue("First paragraph.\nSecond paragraph.");
  });

  it("saves edited copy and confirms it", async () => {
    renderPage(<HomeAdminPage />);
    await flushPromises();
    await waitFor(() => expect(screen.getByLabelText(i18n.t("homeHeroTitle"))).toHaveValue("Objects with a past"));

    fireEvent.change(screen.getByLabelText(i18n.t("homeHeroTitle")), { target: { value: "Curated with curiosity" } });
    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("saveHomePage"), "i") }));

    await waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
    expect(mockedUpdate.mock.calls[0][0]).toMatchObject({ heroTitle: "Curated with curiosity" });
    expect(await screen.findByText(i18n.t("homeUpdated"))).toBeInTheDocument();
  });

  it("reports a failed save", async () => {
    mockedUpdate.mockRejectedValueOnce(new Error("offline"));

    renderPage(<HomeAdminPage />);
    await flushPromises();
    await waitFor(() => expect(screen.getByLabelText(i18n.t("homeHeroTitle"))).toHaveValue("Objects with a past"));

    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("saveHomePage"), "i") }));

    expect(await screen.findByText(i18n.t("formCouldNotSave"))).toBeInTheDocument();
  });

  it("uploads a welcome image with a caption", async () => {
    const created = { id: "img-1", url: "/api/home/images/img-1", caption: "The showroom" };
    mockedUpload.mockResolvedValue(created);

    renderPage(<HomeAdminPage />);
    await flushPromises();
    await waitFor(() => expect(screen.getByLabelText(i18n.t("homeHeroTitle"))).toHaveValue("Objects with a past"));

    fireEvent.change(screen.getByLabelText(i18n.t("imageCaption")), { target: { value: "The showroom" } });
    const image = new File([new Uint8Array([1, 2, 3])], "showroom.png", { type: "image/png" });
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [image] } });

    await waitFor(() => expect(mockedUpload).toHaveBeenCalledWith(image, "The showroom"));
    expect(await screen.findByAltText("The showroom")).toBeInTheDocument();
  });

  it("refuses an image format the gallery cannot show", async () => {
    renderPage(<HomeAdminPage />);
    await flushPromises();
    await waitFor(() => expect(screen.getByLabelText(i18n.t("homeHeroTitle"))).toHaveValue("Objects with a past"));

    const image = new File([new Uint8Array([1, 2, 3])], "anim.gif", { type: "image/gif" });
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [image] } });

    expect(await screen.findByText(i18n.t("imageUnsupported"))).toBeInTheDocument();
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("removes a welcome image again", async () => {
    mockedGetImages.mockResolvedValue([{ id: "img-1", url: "/api/home/images/img-1", caption: "The showroom" }]);
    mockedDelete.mockResolvedValue(undefined);

    renderPage(<HomeAdminPage />);
    await flushPromises();
    await waitFor(() => expect(screen.getByAltText("The showroom")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: i18n.t("removeWelcomeImage") }));

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith("img-1"));
    await waitFor(() => expect(screen.queryByAltText("The showroom")).toBeNull());
  });
});
