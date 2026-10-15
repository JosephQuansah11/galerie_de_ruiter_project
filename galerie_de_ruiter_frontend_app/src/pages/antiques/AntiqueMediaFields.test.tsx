import { fireEvent, screen } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import { AntiqueMediaFields } from "./AntiqueMediaFields";
import type { DraftImage } from "./useNewAntiqueDraft";

const image = (id: string, name: string): DraftImage => ({
  id,
  file: new File([new Uint8Array(1)], name, { type: "image/jpeg" }),
  url: `blob:${id}`,
});

const form = { title: "", artistId: "", description: "", price: "", categoryId: "", modelUrl: "" };

function renderFields(images: DraftImage[], handlers: { moveImage?: jest.Mock; removeImage?: jest.Mock } = {}) {
  const moveImage = handlers.moveImage ?? jest.fn();
  const removeImage = handlers.removeImage ?? jest.fn();
  renderPage(<AntiqueMediaFields form={form} updateModelUrl={jest.fn()} images={images}
    modelFileName={undefined} selectImages={jest.fn()} removeImage={removeImage} moveImage={moveImage} selectModelFile={jest.fn()} />);
  return { moveImage, removeImage };
}

describe("antique media fields", () => {
  it("shows the first photograph large with the rest as thumbnails", () => {
    renderFields([image("a", "front.jpg"), image("b", "back.jpg")]);

    expect(screen.getByText(i18n.t("selectedImageCount", { count: 2 }))).toBeInTheDocument();
    expect(document.querySelectorAll(".antique-gallery-item")).toHaveLength(2);
    expect(document.querySelector(".antique-gallery-main img")).toHaveAttribute("src", "blob:a");
  });

  it("moves a photograph forward so it becomes the main image", () => {
    const { moveImage } = renderFields([image("a", "front.jpg"), image("b", "back.jpg")]);

    fireEvent.click(screen.getByRole("button", { name: i18n.t("moveImageEarlier", { number: 2 }) }));

    expect(moveImage).toHaveBeenCalledWith("b", -1);
  });

  it("removes a photograph by its position", () => {
    const { removeImage } = renderFields([image("a", "front.jpg")]);

    fireEvent.click(screen.getByRole("button", { name: i18n.t("removeImageNumber", { number: 1 }) }));

    expect(removeImage).toHaveBeenCalledWith("a");
  });

  it("shows the empty hint while no image is chosen", () => {
    renderFields([]);
    expect(screen.getByText(i18n.t("chooseImages"))).toBeInTheDocument();
  });
});

