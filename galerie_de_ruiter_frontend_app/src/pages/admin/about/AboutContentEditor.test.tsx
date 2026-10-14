import { fireEvent, screen } from "@testing-library/react";
import { renderPage } from "../../../../test/renderPage";
import i18n from "../../../i18n";
import { AboutContentEditor } from "./AboutContentEditor";

const TOOL_KEYS = ["formatBold", "formatItalic", "formatHeading1", "formatHeading2", "formatHeading3", "formatList", "formatDivider"];

function renderEditor(content: string, onChange = jest.fn()) {
  renderPage(<AboutContentEditor content={content} saving={false} onChange={onChange}
    onSubmit={jest.fn()} label="Page content" savingText="Saving" saveText="Save" />);
  return onChange;
}

function textarea(): HTMLTextAreaElement {
  return screen.getByLabelText("Page content") as HTMLTextAreaElement;
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
});
