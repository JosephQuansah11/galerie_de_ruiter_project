import { fireEvent, screen, waitFor } from "@testing-library/react";
import { flushPromises, renderPage } from "../../test/renderPage";
import i18n from "../i18n";
import { CustomNav } from "./Navigation";
import { getVisibleCategories } from "@/apis/backend_api";

const mockAuth = {
  authenticated: true,
  loading: false,
  token: "test-token",
  profile: { username: "de-ruiter", firstName: "De", lastName: "Ruiter" },
  avatarUrl: undefined as string | undefined,
  roles: ["ADMIN"],
  isAdmin: true,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateProfile: jest.fn(),
  refreshAvatar: jest.fn(),
};

jest.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children?: unknown }) => children,
  useAuth: () => mockAuth,
}));

jest.mock("@/apis/backend_api", () => ({
  getVisibleCategories: jest.fn(),
}));

const mockedCategories = getVisibleCategories as jest.Mock;

beforeEach(() => {
  mockAuth.isAdmin = true;
  mockAuth.authenticated = true;
  mockedCategories.mockResolvedValue([
    { id: "c1", name: "Mirrors", visible: true, itemCount: 2, children: [] },
  ]);
});

function toggler(): HTMLElement {
  return screen.getByRole("button", { name: i18n.t("navMain") });
}

function panel(): HTMLElement {
  const element = document.querySelector("#main-navigation");
  if (!element) throw new Error("The collapsed navigation panel was not rendered.");
  return element as HTMLElement;
}

function list(): HTMLElement {
  const element = panel().querySelector(".icons-list");
  if (!element) throw new Error("The navigation list was not rendered.");
  return element as HTMLElement;
}

describe("Gallery navigation", () => {
  it("links to every public destination", async () => {
    renderPage(<CustomNav />, { auth: false });
    await flushPromises();

    expect(screen.getByRole("link", { name: new RegExp(i18n.t("wishlist"), "i") })).toHaveAttribute("href", "/wishlist");
    expect(screen.getByRole("link", { name: new RegExp(i18n.t("cart"), "i") })).toHaveAttribute("href", "/cart");
    expect(screen.getByRole("link", { name: new RegExp(i18n.t("navGalleryChat"), "i") })).toHaveAttribute("href", "/chat");
    expect(screen.getByRole("link", { name: new RegExp(i18n.t("navAbout"), "i") })).toHaveAttribute("href", "/about");
  });

  it("offers a visitor the pages that need no account, and nothing else", async () => {
    mockAuth.authenticated = false;
    mockAuth.isAdmin = false;
    renderPage(<CustomNav />, { auth: false });
    await flushPromises();

    expect(screen.getByRole("link", { name: new RegExp(i18n.t("navAbout"), "i") })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: new RegExp(i18n.t("location"), "i") })).toHaveAttribute("href", "/map");
    // The list is open to a visitor; the pages that act on the collection are not.
    expect(screen.getByRole("link", { name: new RegExp(i18n.t("browseAntiques"), "i") })).toHaveAttribute("href", "/antiques");
    // Acting on the collection needs an account, so those links are not offered at all.
    expect(screen.queryByRole("link", { name: new RegExp(i18n.t("wishlist"), "i") })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: new RegExp(i18n.t("cart"), "i") })).not.toBeInTheDocument();
  });

  it("keeps the administration links away from visitors", async () => {
    mockAuth.isAdmin = false;
    renderPage(<CustomNav />, { auth: false });
    await flushPromises();

    expect(screen.queryByRole("link", { name: new RegExp(i18n.t("navAdminAntiques"), "i") })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(i18n.t("location"), "i") })).toHaveAttribute("href", "/map");
  });

  it("opens the collapsed panel and covers the bar with a single full-width list", async () => {
    renderPage(<CustomNav />, { auth: false });
    await flushPromises();

    expect(toggler()).toHaveAttribute("aria-expanded", "false");
    expect(panel().className).not.toContain("show");

    fireEvent.click(toggler());

    await waitFor(() => expect(toggler()).toHaveAttribute("aria-expanded", "true"));
    // jsdom has no CSS transitions, so react-bootstrap reports the opening
    // (`collapsing`) state that the browser animates into `show`.
    await waitFor(() => expect(panel().className).toMatch(/collapsing|show/));
    expect(panel()).toHaveAttribute("id", "main-navigation");

    // These are the containers the collapsed stylesheet forces to width: 100%.
    expect(panel().querySelector(":scope > .main-navbar-links")).not.toBeNull();
    expect(panel().querySelector(":scope > .main-navbar-links > .icons-list")).not.toBeNull();
    expect(panel().querySelector(":scope > .icons-list-user-profile")).not.toBeNull();

    // Every navigation entry sits inside that one list, so it spans the full bar.
    expect(list().querySelector("a[href='/wishlist']")).not.toBeNull();
    expect(list().querySelector("a[href='/cart']")).not.toBeNull();
    expect(list().querySelector("a[href='/admin/antiques']")).not.toBeNull();
    expect(list().querySelector(".nav-category-dropdown")).not.toBeNull();
  });

  it("closes the panel again after a destination is chosen", async () => {
    renderPage(<CustomNav />, { auth: false });
    await flushPromises();

    fireEvent.click(toggler());
    await waitFor(() => expect(toggler()).toHaveAttribute("aria-expanded", "true"));
    expect(panel().className).toMatch(/collapsing|show/);

    fireEvent.click(screen.getByRole("link", { name: new RegExp(i18n.t("wishlist"), "i") }));

    await waitFor(() => expect(toggler()).toHaveAttribute("aria-expanded", "false"));
    expect(panel().className).not.toContain("show");
  });

  it("offers the gallery categories in the collapsed panel", async () => {
    renderPage(<CustomNav />, { auth: false });
    await flushPromises();

    expect(await screen.findByText(i18n.t("antiques"))).toBeInTheDocument();
    expect(mockedCategories).toHaveBeenCalled();
  });

  it("shows the categories as a tree, so a subcategory is never read as a main one", async () => {
    mockedCategories.mockResolvedValue([
      {
        id: "c1", name: "Audio - Tv", visible: true, itemCount: 3,
        children: [{ id: "c2", name: "Decoration", visible: true, parentId: "c1", parentName: "Audio - Tv", itemCount: 1, children: [] }],
      },
    ]);
    renderPage(<CustomNav />, { auth: false });
    await flushPromises();

    fireEvent.click(screen.getByText(i18n.t("antiques")));

    const grid = document.querySelector(".category-dropdown-grid");
    if (!grid) throw new Error("The Antiek menu did not render its category tree.");
    const parent = grid.querySelector(".category-dropdown-group > .category-parent");
    const child = grid.querySelector(".category-dropdown-children > .category-child");
    if (!parent || !child) throw new Error("The Antiek menu did not nest a subcategory under its main category.");

    // The child hangs under the parent's branch…
    expect(parent.closest(".category-dropdown-group")).toBe(child.closest(".category-dropdown-group"));
    // …so it keeps its own name instead of repeating the main category in front of it.
    expect(parent.textContent).toContain("Audio - Tv");
    expect(child.textContent).toContain("Decoration");
    expect(child.textContent).not.toContain("Audio - Tv");
    // The branch still filters the catalogue on the subcategory.
    expect(child).toHaveAttribute("href", `/antiques?category=${encodeURIComponent("Decoration")}`);
  });
});
