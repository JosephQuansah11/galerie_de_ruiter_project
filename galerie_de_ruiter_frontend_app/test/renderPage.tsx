import type { ReactElement, ReactNode } from "react";
import { act, render, type RenderResult } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ShoppingProvider } from "@/context/ShoppingContext";

export type PageRenderOptions = {
  /** Initial router entry so `useSearchParams` and `useParams` behave like production. */
  route?: string;
  /** Wrap in the basket/wishlist provider (catalogue, cart and wishlist pages need it). */
  shopping?: boolean;
  /** Skip the auth provider when the test replaces `useAuth` with its own double. */
  auth?: boolean;
  /** Skip the memory router when the component under test provides its own (for example `App`). */
  router?: boolean;
};

export function PageProviders({ children, route = "/", shopping = false, auth = true, router = true }: PageRenderOptions & { children: ReactNode }) {
  const app = auth ? <AuthProvider>{children}</AuthProvider> : <>{children}</>;
  const withShopping = shopping ? <ShoppingProvider>{app}</ShoppingProvider> : app;
  const routed = router ? <MemoryRouter initialEntries={[route]}>{withShopping}</MemoryRouter> : withShopping;
  return <I18nextProvider i18n={i18n}>
    <ThemeProvider>
      <LanguageProvider>{routed}</LanguageProvider>
    </ThemeProvider>
  </I18nextProvider>;
}

/** Renders a page the way the application shell does, including routing, i18n and theme. */
export function renderPage(ui: ReactElement, options: PageRenderOptions = {}): RenderResult {
  return render(ui, { wrapper: ({ children }) => <PageProviders {...options}>{children}</PageProviders> });
}

/**
 * Lets pending effects (keycloak session checks, API promises) settle inside `act`
 * so React does not warn about updates outside a test boundary.
 */
export async function flushPromises(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}
