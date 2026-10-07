import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  return (
    <label className="search-field">
      <Search size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? t("searchPlaceholder")}
        aria-label={t("search")}
      />
      <kbd>/</kbd>
    </label>
  );
}
