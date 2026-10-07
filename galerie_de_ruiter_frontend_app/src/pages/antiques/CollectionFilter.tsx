import { Dropdown } from "react-bootstrap";
import type { Category } from "@/models/antiques/Antique";
import { useTranslation } from "react-i18next";

export function CollectionFilter({ categories, category, onSelect }: {
  categories: Category[];
  category: string;
  onSelect: (category: string) => void;
}) {
  const { t } = useTranslation();
  return <div>
    <Dropdown className="collection-filter-dropdown">
      <Dropdown.Toggle variant="outline-secondary">{category || t("allPieces")}</Dropdown.Toggle>
      <Dropdown.Menu className="collection-dropdown-menu">
        <Dropdown.Item as="button" onClick={() => onSelect("")}>{t("allPieces")}</Dropdown.Item>
        <div className="collection-dropdown-grid">{categories.map((item) => <div className="collection-dropdown-group" key={item.id}>
          <Dropdown.Item as="button" onClick={() => onSelect(item.name)}>{item.name}<span>{item.itemCount}</span></Dropdown.Item>
          {item.children?.map((child) => <Dropdown.Item as="button" className="collection-dropdown-child" key={child.id} onClick={() => onSelect(child.name)}>{child.name}<span>{child.itemCount}</span></Dropdown.Item>)}
        </div>)}</div>
      </Dropdown.Menu>
    </Dropdown>
  </div>;
}
