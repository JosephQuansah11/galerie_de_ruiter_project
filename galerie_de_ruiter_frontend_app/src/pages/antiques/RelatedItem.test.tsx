import { fireEvent, screen } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import type Antique from "@/models/antiques/Antique";
import type { Translate } from "./detailTypes";
import { RelatedItem } from "./RelatedItem";

const t: Translate = (key) => String(i18n.t(key));
const price = 1250;
const piece: Antique = {
  id: "piece-1",
  title: "American Sculptuur door Cristiana Isoleri",
  price,
  imageUrl: "/api/antiques/piece-1/image/photo-1",
};

function renderItem(select: jest.Mock = jest.fn()) {
  renderPage(<RelatedItem antique={piece} locale="nl-BE" t={t} select={select} />, { auth: false });
  return select;
}

describe("related piece card", () => {
  it("is a plain card link, so the site-wide button look stays out of it", () => {
    renderItem();

    const card = screen.getByRole("link", { name: /American Sculptuur/ });
    // A Bootstrap `btn` wrapper used to centre the card's rows and give the title its full,
    // unbroken width, which painted the title over the card beside it.
    expect(card.className).toBe("detail-related-item");
    expect(card).toHaveAttribute("href", "/antiques/piece-1");
    expect(card.querySelector(".detail-related-name")).toHaveTextContent(piece.title);
    // The euro sign and the thousands separator differ per locale, so match on the digits.
    expect(card.querySelector(".detail-related-price")).toHaveTextContent(/1\.250,00/);
  });

  it("opens the piece it stands for", () => {
    const select = renderItem();

    fireEvent.click(screen.getByRole("link", { name: /American Sculptuur/ }));

    expect(select).toHaveBeenCalledWith("piece-1");
  });

  it("draws the small copy of the photograph, not the original", () => {
    renderItem();

    const image = screen.getByRole("link", { name: /American Sculptuur/ }).querySelector("img");
    expect(image?.getAttribute("src")).toContain("/api/antiques/piece-1/image/photo-1/thumbnail");
  });
});
