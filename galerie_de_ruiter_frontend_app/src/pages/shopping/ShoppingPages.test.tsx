import { useEffect, useRef, useState, type ReactNode } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { flushPromises, renderPage } from "../../../test/renderPage";
import i18n, { formatEuroAmount } from "../../i18n";
import { useShopping } from "@/context/ShoppingContext";
import CartPage from "./CartPage";
import WishlistPage from "./WishlistPage";
import type Antique from "@/models/antiques/Antique";

const antique: Antique = { id: "1", title: "Carved walnut mirror", category: "Mirrors", price: 250 };

/** Seeds the shared basket so the pages render the signed-in shopping state. */
function BasketSeed({ children, wishlist = false }: { children: ReactNode; wishlist?: boolean }) {
  const shopping = useShopping();
  const [ready, setReady] = useState(false);
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (wishlist) shopping.toggleWishlist(antique);
    else shopping.addToCart(antique);
    setReady(true);
  }, [shopping, wishlist]);
  return ready ? <>{children}</> : null;
}

describe("Cart page", () => {
  it("invites the visitor to browse when nothing is in the basket", async () => {
    renderPage(<CartPage />, { shopping: true });
    await flushPromises();

    expect(screen.getByText(i18n.t("emptyCart"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(i18n.t("browseAntiques"), "i") })).toBeInTheDocument();
  });

  it("lists the basket contents with the estimated total", async () => {
    renderPage(<BasketSeed><CartPage /></BasketSeed>, { shopping: true });

    expect(await screen.findByText("Carved walnut mirror")).toBeInTheDocument();
    expect(screen.getByText(i18n.t("estimatedTotal"))).toBeInTheDocument();
    expect(document.querySelector(".cart-total")).toHaveTextContent(formatEuroAmount(250, "en-BE"));
  });

  it("recalculates the estimated total when the quantity changes", async () => {
    renderPage(<BasketSeed><CartPage /></BasketSeed>, { shopping: true });
    await screen.findByText("Carved walnut mirror");

    fireEvent.change(screen.getByLabelText(i18n.t("quantityFor", { title: "Carved walnut mirror" })), { target: { value: "2" } });

    await waitFor(() => expect(document.querySelector(".cart-total")).toHaveTextContent(formatEuroAmount(500, "en-BE")));
  });

  it("removes a piece from the basket", async () => {
    renderPage(<BasketSeed><CartPage /></BasketSeed>, { shopping: true });
    await screen.findByText("Carved walnut mirror");

    fireEvent.click(screen.getByRole("button", { name: i18n.t("removeFromCart", { title: "Carved walnut mirror" }) }));

    await waitFor(() => expect(screen.getByText(i18n.t("emptyCart"))).toBeInTheDocument());
  });
});

describe("Wishlist page", () => {
  it("explains an empty wishlist", async () => {
    renderPage(<WishlistPage />, { shopping: true });
    await flushPromises();

    expect(screen.getByText(i18n.t("wishlistEmpty"))).toBeInTheDocument();
  });

  it("shows the saved pieces with the basket and view actions", async () => {
    renderPage(<BasketSeed wishlist><WishlistPage /></BasketSeed>, { shopping: true });

    expect(await screen.findByText("Carved walnut mirror")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(i18n.t("addToCartShort"), "i") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("view") })).toBeInTheDocument();
  });

  it("removes a saved piece again", async () => {
    renderPage(<BasketSeed wishlist><WishlistPage /></BasketSeed>, { shopping: true });
    await screen.findByText("Carved walnut mirror");

    fireEvent.click(screen.getByRole("button", { name: i18n.t("removeFromWishlist", { title: "Carved walnut mirror" }) }));

    await waitFor(() => expect(screen.getByText(i18n.t("wishlistEmpty"))).toBeInTheDocument());
  });
});
