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

function renderFields(images: DraftImage[], removeImage: jest.Mock) {
  return renderPage(
    <AntiqueMediaFields form={form} update={jest.fn()} updateModelUrl={jest.fn()} images={images}
      modelFileName={undefined} selectImages={jest.fn()} removeImage={removeImage} selectModelFile={jest.fn()} />,
  );
}

describe("antique media fields", () => {
  it("previews every picked image before the piece is saved", () => {
    renderFields([image("a", "front.jpg"), image("b", "back.jpg")], jest.fn());

    expect(screen.getByText(i18n.t("selectedImageCount", { count: 2 }))).toBeInTheDocument();
    const previews = document.querySelectorAll(".antique-image-preview img");
    expect(previews).toHaveLength(2);
    expect(previews[0]).toHaveAttribute("src", "blob:a");
    expect(previews[1]).toHaveAttribute("src", "blob:b");
  });

  it("removes an image by id from its thumbnail control", () => {
    const removeImage = jest.fn();
    renderFields([image("a", "front.jpg")], removeImage);

    fireEvent.click(screen.getByRole("button", { name: i18n.t("removeImage", { name: "front.jpg" }) }));

    expect(removeImage).toHaveBeenCalledWith("a");
  });

  it("shows the empty hint while no image is chosen", () => {
    renderFields([], jest.fn());
    expect(screen.getByText(i18n.t("chooseImages"))).toBeInTheDocument();
  });
});
