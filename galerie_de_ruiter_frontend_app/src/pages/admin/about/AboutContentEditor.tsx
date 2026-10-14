import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ReactButton";
import { Bold, Heading1, Heading2, Heading3, Image as ImageIcon, Italic, List, Minus, Save } from "lucide-react";
import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { uploadAboutImage } from "@/apis/backend_api";
import { renderAboutContent } from "@/pages/about/renderAboutContent";
import { applyHeading, applyList, insertBlock, wrapSelection, type FormatResult } from "./formatActions";

type Props = { content: string; saving: boolean; onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; label: string; savingText: string; saveText: string };

type Tool = { labelKey: string; icon: ReactNode; transform: (value: string, start: number, end: number) => FormatResult };

/** Keeps the characters that would break the Markdown image syntax out of the alt text. */
function imageAlt(fileName: string): string {
  return fileName.replace(/[[\]()]/g, " ").replace(/\s+/g, " ").trim();
}

export function AboutContentEditor({ content, saving, onChange, onSubmit, label, savingText, saveText }: Props) {
  const { t } = useTranslation();
  const textarea = useRef<HTMLTextAreaElement | null>(null);
  const filePicker = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  // Each tool edits the plain Markdown the story is stored as, so `renderAboutContent` stays
  // the single source of truth for how the page looks.
  const tools: Tool[] = [
    { labelKey: "formatBold", icon: <Bold size={16} />, transform: (value, start, end) => wrapSelection(value, start, end, "**") },
    { labelKey: "formatItalic", icon: <Italic size={16} />, transform: (value, start, end) => wrapSelection(value, start, end, "*") },
    { labelKey: "formatHeading1", icon: <Heading1 size={16} />, transform: (value, start, end) => applyHeading(value, start, end, 1) },
    { labelKey: "formatHeading2", icon: <Heading2 size={16} />, transform: (value, start, end) => applyHeading(value, start, end, 2) },
    { labelKey: "formatHeading3", icon: <Heading3 size={16} />, transform: (value, start, end) => applyHeading(value, start, end, 3) },
    { labelKey: "formatList", icon: <List size={16} />, transform: applyList },
    { labelKey: "formatDivider", icon: <Minus size={16} />, transform: (value, start, end) => insertBlock(value, start, end, "---") },
  ];

  /** Applies a transform and puts the caret back where the tool left it after React renders. */
  const applyResult = (result: FormatResult) => {
    onChange(result.value);
    const node = textarea.current;
    if (!node) return;
    window.requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const runTool = (tool: Tool) => {
    const node = textarea.current;
    if (!node) return;
    applyResult(tool.transform(node.value, node.selectionStart, node.selectionEnd));
  };

  /** Uploads the picked photograph and drops it into the story as a Markdown image. */
  const insertImage = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setUploading(true);
    setUploadFailed(false);
    try {
      const image = await uploadAboutImage(file);
      const node = textarea.current;
      if (node) {
        applyResult(insertBlock(node.value, node.selectionStart, node.selectionEnd, `![${imageAlt(file.name)}](${image.url})`));
      }
    } catch {
      setUploadFailed(true);
    } finally {
      setUploading(false);
    }
  };

  return <form onSubmit={onSubmit}>
    <div className="about-editor-layout">
      <div>
        <label className="form-label" htmlFor="about-content">{label}</label>
        <div className="about-editor-toolbar" role="toolbar" aria-label={t("formattingTools")}>
          {tools.map((tool) => <button key={tool.labelKey} type="button" className="about-editor-tool"
            title={t(tool.labelKey)} aria-label={t(tool.labelKey)} onClick={() => runTool(tool)}>
            {tool.icon}
          </button>)}
          {/* A photograph is uploaded first, then dropped into the story as Markdown. */}
          <button type="button" className="about-editor-tool" title={t("formatImage")} aria-label={t("formatImage")}
            disabled={uploading} onClick={() => filePicker.current?.click()}>
            {uploading ? <Spinner animation="border" size="sm" /> : <ImageIcon size={16} />}
          </button>
        </div>
        <input ref={filePicker} type="file" accept="image/*" className="visually-hidden"
          aria-label={t("chooseImages")} onChange={(event) => void insertImage(event.currentTarget)} />
        <textarea id="about-content" ref={textarea} className="form-control about-editor-input" rows={22}
          required maxLength={50000} value={content} onChange={(event) => onChange(event.target.value)} />
        {uploadFailed && <p className="about-editor-error" role="alert">{t("imageUploadFailed")}</p>}
        <p className="about-editor-hint">{t("formattingHint")}</p>
      </div>
      <aside className="about-editor-preview">
        <span className="about-editor-preview-label">{t("preview")}</span>
        <div className="about-content">{renderAboutContent(content)}</div>
      </aside>
    </div>
    <Button className="btn btn-primary" disabled={saving} type="submit">
      {saving ? <Spinner size="sm" /> : <Save size={16} />}{saving ? savingText : saveText}
    </Button>
  </form>;
}
