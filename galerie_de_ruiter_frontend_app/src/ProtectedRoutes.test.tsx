import { Suspense, type ReactNode } from "react";
import { screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { renderPage } from "../test/renderPage";
import { ProtectedRoutes } from "./ProtectedRoutes";

jest.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: jest.fn(),
}));

// The real pages pull in the API and their own controls. The guard is what this test exercises,
// so a heading is enough to tell which route rendered.
jest.mock("@/pages/WelcomePage", () => ({
  __esModule: true,
  default: () => <h1>Landing page</h1>,
}));
jest.mock("@/pages/admin/AntiqueFolderImportPage", () => ({
  __esModule: true,
  default: () => <h1>Import page</h1>,
}));

const mockedUseAuth = useAuth as jest.Mock;

const member = { loading: false, authenticated: true, isAdmin: false };
const admin = { ...member, isAdmin: true };

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderAt(route: string) {
  return renderPage(
    <MemoryRouter initialEntries={[route]}>
      <LocationProbe />
      <Suspense fallback={<p>loading</p>}>
        <ProtectedRoutes />
      </Suspense>
    </MemoryRouter>,
    { auth: false, router: false },
  );
}

describe("admin routes", () => {
  it.each(["/admin/dashboard", "/admin/antiques/import"])(
    "sends a signed-in member away from %s",
    async (route) => {
      mockedUseAuth.mockReturnValue(member);

      renderAt(route);

      await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/));
      expect(screen.getByRole("heading", { name: "Landing page" })).toBeInTheDocument();
      expect(screen.queryByText("Import page")).not.toBeInTheDocument();
    },
  );

  it("lets an admin open the folder import", async () => {
    mockedUseAuth.mockReturnValue(admin);

    renderAt("/admin/antiques/import");

    expect(await screen.findByRole("heading", { name: "Import page" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/admin\/antiques\/import$/);
  });
});
