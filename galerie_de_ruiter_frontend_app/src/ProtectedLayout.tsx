import { Suspense } from "react";
import { Container } from "react-bootstrap";
import { CustomNav } from "@/components/Navigation";
import { PageLoading } from "@/components/PageLoading";
import { SiteFooter } from "@/components/SiteFooter";
import { ShoppingProvider } from "./context/ShoppingContext";
import { ProtectedRoutes } from "./ProtectedRoutes";

/**
 * The application shell. It draws as soon as the bundle runs, because the account check is a
 * round trip to the identity provider: holding the first paint until it answered put the whole
 * page behind that round trip, which is what made the first contentful paint late. The routes
 * that need an account wait for the check themselves, and the account menu appears once the
 * answer is known.
 *
 * The footer is part of the shell, so every page ends with it - including the ones a visitor
 * reaches without an account, which is where the Instagram profile is worth having.
 */
export function ProtectedLayout() {
  return <Container className="container-div">
    <CustomNav />
    {/* The navigation stays put while a page's own chunk arrives. */}
    <ShoppingProvider><main className="app-main main-content">
      <Suspense fallback={<PageLoading />}><ProtectedRoutes /></Suspense>
    </main></ShoppingProvider>
    <SiteFooter />
  </Container>;
}
