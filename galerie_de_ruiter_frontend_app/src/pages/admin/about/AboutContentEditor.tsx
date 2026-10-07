import type { FormEvent } from "react";
import { Button } from "@/components/ReactButton";
import { Save } from "lucide-react";
import { Spinner } from "react-bootstrap";

type Props = { content: string; saving: boolean; onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; label: string; savingText: string; saveText: string };
export function AboutContentEditor({ content, saving, onChange, onSubmit, label, savingText, saveText }: Props) {
  return <form onSubmit={onSubmit}>
    <div className="mb-3"><label className="form-label">{label}</label>
      <textarea className="form-control" rows={28} required maxLength={50000} value={content}
        onChange={(event) => onChange(event.target.value)} />
    </div>
    <Button className="btn btn-primary" disabled={saving} type="submit">
      {saving ? <Spinner size="sm" /> : <Save size={16} />}{saving ? savingText : saveText}
    </Button>
  </form>;
}
