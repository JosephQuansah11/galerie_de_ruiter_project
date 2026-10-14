import { fireEvent, screen } from "@testing-library/react";
import { renderPage } from "../../../../test/renderPage";
import i18n from "../../../i18n";
import { AntiqueImageEditor } from "./AntiqueImageEditor";
import type { SelectedImage } from "@/pages/antiques/useImageSelection";

const selected = (id: string, name: string): SelectedImage => ({
  id,
  file: new File([new Uint8Array(1)], name, { type: "image/jpeg" }),
  url: `blob:${id}`,
});

const storedImages = ["/api/antiques/1/image/aaa", "/api/antiques/1/image/bbb"];

function renderEditor(overrides: Partial<Parameters<typeof AntiqueImageEditor>[0]> = {}) {
  const props = {
    existingUrls: storedImages,
    removedIds: [] as string[],
    onRemoveExisting: jest.fn(),
    newImages: [] as SelectedImage[],
    onAddImages: jest.fn(),
    onRemoveNew: jest.fn(),
    ...overrides,
  };
  renderPage(<AntiqueImageEditor {...props} />);
  return props;
}

describe("antique image editor", () => {
  it("shows the stored photographs with a remove control", () => {
    const { onRemoveExisting } = renderEditor();

    expect(screen.getByText(i18n.t("selectedImageCount", { count: 2 }))).toBeInTheDocument();
    expect(document.querySelectorAll(".antique-image-preview")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: i18n.t("removeImageNumber", { number: 1 }) }));

    expect(onRemoveExisting).toHaveBeenCalledWith("aaa");
  });

  it("hides a stored photograph that is already marked for removal", () => {
    renderEditor({ removedIds: ["aaa"] });

    expect(document.querySelectorAll(".antique-image-preview")).toHaveLength(1);
    expect(screen.getByText(i18n.t("selectedImageCount", { count: 1 }))).toBeInTheDocument();
  });

  it("previews a newly picked photograph and can remove it again", () => {
    const { onRemoveNew } = renderEditor({ existingUrls: [], newImages: [selected("n1", "front.jpg")] });

    expect(screen.getByText(i18n.t("newPhoto"))).toBeInTheDocument();
    expect(screen.getByText(i18n.t("selectedImageCount", { count: 1 }))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: i18n.t("removeImage", { name: "front.jpg" }) }));

    expect(onRemoveNew).toHaveBeenCalledWith("n1");
  });
});
