import { screen } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import type Antique from "@/models/antiques/Antique";
import type { Translate } from "./detailTypes";
import { DetailMedia } from "./DetailMedia";

const t: Translate = (key) => String(i18n.t(key));
const piece: Antique = { id: "piece-1", title: "Walnut cabinet" };

describe("detail media", () => {
  it("lets the browser choose between the 800 and 1600 pixel copies", () => {
    renderPage(
      <DetailMedia antique={piece} urls={["/api/antiques/piece-1/image/photo-1"]}
        preview="/api/antiques/piece-1/image/photo-1" select={jest.fn()} t={t} />,
      { auth: false },
    );

    const main = screen.getByAltText(piece.title);
    expect(main.getAttribute("src")).toContain("/api/antiques/piece-1/image/photo-1/large");
    expect(main.getAttribute("srcset")).toContain("/medium 800w");
    expect(main.getAttribute("srcset")).toContain("/large 1600w");
    expect(main).toHaveAttribute("sizes", "(max-width: 900px) 100vw, 800px");
  });

  it("treats the piece's main photograph as the hero", () => {
    renderPage(
      <DetailMedia antique={piece} urls={["/api/antiques/piece-1/image/photo-1"]}
        preview="/api/antiques/piece-1/image/photo-1" select={jest.fn()} t={t} />,
      { auth: false },
    );

    const main = screen.getByAltText(piece.title);
    expect(main).toHaveAttribute("loading", "eager");
    expect(main).toHaveAttribute("fetchpriority", "high");
  });
});