import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ReactButton";

export function DropdownPanel({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="dropdown">
      <Button
        className="quiet-button"
        onClick={() => setOpen((value) => !value)}
        text={<>{label}<ChevronDown size={16} /></>}
      />
      {open && <div className="dropdown-panel">{children}</div>}
    </div>
  );
}
