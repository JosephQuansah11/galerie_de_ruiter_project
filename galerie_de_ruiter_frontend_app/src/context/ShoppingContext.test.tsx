import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type Antique from "@/models/antiques/Antique";
import { addWishlistItem, getWishlist, removeWishlistItem } from "@/apis/wishlist_api";
import { ShoppingProvider, useShopping } from "./ShoppingContext";

jest.mock("@/apis/wishlist_api", () => ({
  getWishlist: jest.fn(),
  addWishlistItem: jest.fn(),
  removeWishlistItem: jest.fn(),
}));

const mockedGet = getWishlist as jest.Mock;
const mockedAdd = addWishlistItem as jest.Mock;
const mockedRemove = removeWishlistItem as jest.Mock;
const piece = { id: "piece-1", title: "Carved walnut mirror", price: 480 } as Antique;

function Probe() {
  const shopping = useShopping();
  return <>
    <span data-testid="wishlist-count">{shopping.wishlist.length}</span>
    <button type="button" onClick={() => void shopping.toggleWishlist(piece)}>toggle</button>
  </>;
}

describe("the server-backed interested pieces", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockResolvedValue([piece]);
    mockedAdd.mockResolvedValue(undefined);
    mockedRemove.mockResolvedValue(undefined);
  });

  it("loads the signed-in visitor's list and removes a piece on the server", async () => {
    render(<ShoppingProvider authenticated loadWishlist><Probe /></ShoppingProvider>);

    await waitFor(() => expect(screen.getByTestId("wishlist-count")).toHaveTextContent("1"));
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));

    await waitFor(() => expect(mockedRemove).toHaveBeenCalledWith(piece.id));
    expect(screen.getByTestId("wishlist-count")).toHaveTextContent("0");
  });

  it("adds a piece the visitor had not marked yet", async () => {
    mockedGet.mockResolvedValue([]);
    render(<ShoppingProvider authenticated loadWishlist><Probe /></ShoppingProvider>);

    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));

    await waitFor(() => expect(mockedAdd).toHaveBeenCalledWith(piece.id));
    expect(screen.getByTestId("wishlist-count")).toHaveTextContent("1");
  });
});
