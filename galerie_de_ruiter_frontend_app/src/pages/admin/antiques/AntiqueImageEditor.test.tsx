import { fireEvent, screen } from "@testing-library/react";
import { renderPage } from "../../../../test/renderPage";
import i18n from "../../../i18n";
import { AntiqueImageEditor } from "./AntiqueImageEditor";
import type { EditableImage } from "./useAntiqueImageEditing";

const stored = (imageId: string): EditableImage => ({
  key: `stored-${imageId}`,
  url: `http://api.test/api/antiques/1/image/${imageId}`,
  imageId,
});

const picked = (key: string, name: string): EditableImage => ({
  key,
  url: `blob:${key}`,
  file: new File([new Uint8Array(1)], name, { type: "image/jpeg" }),
});

function renderEditor(images: EditableImage[], handlers: { onMove?: jest.Mock; onRemove?: jest.Mock } = {}) {
  const onMove = handlers.onMove ?? jest.fn();
  const onRemove = handlers.onRemove ?? jest.fn();
  renderPage(<AntiqueImageEditor images={images} onAddImages={jest.fn()} onMove={onMove} onRemove={onRemove} />);
  return { onMove, onRemove };
}

describe("antique image editor", () => {
  it("shows the stored photographs with move and remove controls", () => {
    const { onMove, onRemove } = renderEditor([stored("aaa"), stored("bbb")]);

    expect(screen.getByText(i18n.t("selectedImageCount", { count: 2 }))).toBeInTheDocument();
    expect(document.querySelectorAll(".antique-gallery-item")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: i18n.t("removeImageNumber", { number: 1 }) }));
    expect(onRemove).toHaveBeenCalledWith("stored-aaa");

    fireEvent.click(screen.getByRole("button", { name: i18n.t("moveImageLater", { number: 1 }) }));
    expect(onMove).toHaveBeenCalledWith("stored-aaa", 1);
  });

  it("marks a freshly picked photograph as new", () => {
    renderEditor([picked("new-1", "front.jpg")]);

    expect(screen.getByText(i18n.t("newPhoto"))).toBeInTheDocument();
  });

  it("disables the move controls at the ends of the strip", () => {
    renderEditor([stored("aaa"), stored("bbb")]);

    expect(screen.getByRole("button", { name: i18n.t("moveImageEarlier", { number: 1 }) })).toBeDisabled();
    expect(screen.getByRole("button", { name: i18n.t("moveImageLater", { number: 2 }) })).toBeDisabled();
  });
});

