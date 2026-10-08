import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import CategoryAdminPage from "./CategoryAdminPage";
import { createCategory, getAllCategories } from "@/apis/backend_api";
import type { Category } from "@/models/antiques/Antique";

const mockAuth = {
  authenticated: true,
  loading: false,
  token: "test-token",
  profile: { username: "de-ruiter" },
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
  getAllCategories: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
}));

const mockedCategories = getAllCategories as jest.Mock;
const mockedCreate = createCategory as jest.Mock;

const categories: Category[] = [
  { id: "c1", name: "Mirrors", visible: true, itemCount: 2, children: [] },
  { id: "c2", name: "Lighting", visible: false, itemCount: 1, children: [] },
];

beforeEach(() => {
  mockAuth.isAdmin = true;
  mockedCategories.mockResolvedValue(categories);
  mockedCreate.mockResolvedValue({ id: "c3", name: "Ceramics", visible: true, itemCount: 0, children: [] });
});

describe("Category administration page", () => {
  it("lists the catalogue categories", async () => {
    renderPage(<CategoryAdminPage />);

    expect(await screen.findByText("Mirrors")).toBeInTheDocument();
    expect(screen.getByText("Lighting")).toBeInTheDocument();
  });

  it("creates a category from the curator form", async () => {
    renderPage(<CategoryAdminPage />);
    await screen.findByText("Mirrors");

    fireEvent.change(screen.getByPlaceholderText(i18n.t("newCategoryName")), { target: { value: "Ceramics" } });
    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("addCategory"), "i") }));

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledWith("Ceramics", undefined));
    expect(await screen.findByText("Ceramics")).toBeInTheDocument();
  });

  it("keeps the catalogue sections away from visitors without the administrator role", () => {
    mockAuth.isAdmin = false;

    renderPage(<CategoryAdminPage />);

    expect(screen.getByText(i18n.t("adminAccessRequired"))).toBeInTheDocument();
    expect(mockedCategories).not.toHaveBeenCalled();
  });
});
