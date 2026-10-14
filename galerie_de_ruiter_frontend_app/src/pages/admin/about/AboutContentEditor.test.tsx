import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderPage } from "../../../../test/renderPage";
import i18n from "../../../i18n";
import { fileListOf } from "../../../../test/fileList";
import { uploadAboutImage } from "@/apis/backend_api";
import { AboutContentEditor } from "./AboutContentEditor";

jest.mock("@/apis/backend_api", () => ({ uploadAboutImage: jest.fn() }));

const mockedUpload = uploadAboutImage as jest.Mock;

const TOOL_KEYS = ["formatBold", "formatItalic", "formatHeading1", "formatHeading2", "formatHeading3", "formatList", "formatDivider", "formatImage"];

function renderEditor(content: string, onChange = jest.fn()) {
  renderPage(<AboutContentEditor content={content} saving={false} onChange={onChange}
    onSubmit={jest.fn()} label="Page content" savingText="Saving" saveText="Save" />);
  return onChange;
}

function textarea(): HTMLTextAreaElement {
  return screen.getByLabelText("Page content") as HTMLTextAreaElement;
}

/** Hands the editor's hidden file input the file a picker would. */
function pickImage(name = "story.jpg"): void {
  const input = screen.getByLabelText(i18n.t("chooseImages")) as HTMLInputElement;
  Object.defineProperty(input, "files", { configurable: true, value: fileListOf(new File([new Uint8Array(1)], name, { type: "image/jpeg" })) });
  fireEvent.change(input);
}

describe("about content editor", () => {
  it("offers every formatting tool", () => {
    renderEditor("Story");

    for (const key of TOOL_KEYS) {
      expect(screen.getByRole("button", { name: i18n.t(key) })).toBeInTheDocument();
    }
  });

  it("wraps the selected text in bold", () => {
    const onChange = renderEditor("Gallery story");
    textarea().setSelectionRange(0, 7);

    fireEvent.click(screen.getByRole("button", { name: i18n.t("formatBold") }));

    expect(onChange).toHaveBeenCalledWith("**Gallery** story");
  });

  it("turns the caret's line into a heading", () => {
    const onChange = renderEditor("Gallery story");
    textarea().setSelectionRange(3, 3);

    fireEvent.click(screen.getByRole("button", { name: i18n.t("formatHeading2") }));

    expect(onChange).toHaveBeenCalledWith("## Gallery story");
  });

  it("turns the selected lines into a bullet list", () => {
    const onChange = renderEditor("One\nTwo");
    textarea().setSelectionRange(0, 7);

    fireEvent.click(screen.getByRole("button", { name: i18n.t("formatList") }));

    expect(onChange).toHaveBeenCalledWith("- One\n- Two");
  });

  it("previews the story while it is edited", () => {
    renderEditor("# Gallery story");

    expect(screen.getByText(i18n.t("preview"))).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Gallery story" })).toBeInTheDocument();
  });

  it("uploads a photograph and inserts it into the story", async () => {
    mockedUpload.mockResolvedValue({ id: "1", url: "/api/about/images/1" });
    const onChange = renderEditor("Story");
    textarea().setSelectionRange(5, 5);

    pickImage("story.jpg");

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls[0][0]).toContain("![story.jpg](/api/about/images/1)");
    expect(mockedUpload).toHaveBeenCalledTimes(1);
  });

  it("explains a failed image upload", async () => {
    mockedUpload.mockRejectedValue(new Error("offline"));
    renderEditor("Story");

    pickImage();

    expect(await screen.findByRole("alert")).toHaveTextContent(i18n.t("imageUploadFailed"));
  });
});
