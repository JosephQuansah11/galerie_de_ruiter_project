/**
 * The page keycloak-js loads in a hidden iframe for the silent sign-in check. The identity
 * provider answers in the iframe's fragment, which only the iframe itself can read, so it hands
 * its address to the gallery's window and keycloak-js picks the answer out of it.
 *
 * It is a file rather than an inline script so the Content-Security-Policy can stay
 * `script-src 'self'` with no 'unsafe-inline' (see nginx.conf).
 */
parent.postMessage(window.location.href, window.location.origin);
