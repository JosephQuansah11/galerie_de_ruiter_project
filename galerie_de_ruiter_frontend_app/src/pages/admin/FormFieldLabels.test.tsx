import { screen } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "@/i18n";
import { ArtistSearch } from "@/pages/antiques/ArtistSearch";
import { AntiqueImageEditor } from "./antiques/AntiqueImageEditor";
import { CategoryCreateForm } from "./categories/CategoryCreateForm";
import { LocationCoordinates } from "./location/LocationCoordinates";

/**
 * Lighthouse's "Form elements have associated labels" audit fails on a control whose label only
 * sits next to it: react-bootstrap ties the two together through `controlId` on `Form.Group`,
 * which is easy to leave out and invisible in the rendered page. These tests fail if one of the
 * forms loses that link again, so the audit stays passing.
 */
describe("admin form labels", () => {
  it("associates the location coordinates with their labels", () => {
    renderPage(
      <LocationCoordinates
        form={{ address: "Groenselstraat 48", openingHours: "Thursday to Sunday", latitude: 51.1, longitude: 4.08 }}
        update={jest.fn()}
      />,
      { auth: false },
    );

    expect(screen.getByLabelText("Latitude")).toBeInTheDocument();
    expect(screen.getByLabelText("Longitude")).toBeInTheDocument();
  });

  it("associates the new-category fields with their labels", () => {
    renderPage(
      <CategoryCreateForm
        name=""
        setName={jest.fn()}
        parentId=""
        setParentId={jest.fn()}
        addCategory={jest.fn()}
        categories={[]}
      />,
      { auth: false },
    );

    expect(screen.getByLabelText(i18n.t("newCategoryName"))).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("categories"))).toBeInTheDocument();
  });

  it("associates the artist search with its label", () => {
    renderPage(
      <ArtistSearch query="" setQuery={jest.fn()} designers={[]} choose={jest.fn()} />,
      { auth: false },
    );

    expect(screen.getByLabelText(i18n.t("artist"))).toBeInTheDocument();
  });

  it("associates the image picker of a piece with its label", () => {
    renderPage(
      <AntiqueImageEditor images={[]} onAddImages={jest.fn()} onMove={jest.fn()} onRemove={jest.fn()} />,
      { auth: false },
    );

    expect(screen.getByLabelText(i18n.t("editAntiqueImages"))).toBeInTheDocument();
  });
});
