/**
 * Silences the one three.js notice our dependencies emit on their own.
 *
 * three.js r183 deprecated `THREE.Clock` in favour of `THREE.Timer`, and the Clock
 * constructor warns on every instantiation. We never build a Clock ourselves: the
 * `@react-three/fiber` 9.x line (current stable) creates one for every `<Canvas>` mount,
 * so the message returns on each navigation and hot reload and drowns out the console
 * lines that actually matter.
 *
 * three exposes `setConsoleFunction()` for exactly this. The filter matches the message
 * exactly, so only that deprecation notice is dropped: every other three.js log, including
 * TSL stack-trace warnings, still reaches the browser console unchanged.
 *
 * REMOVAL: delete this file and its import in `src/index.tsx` once React Three Fiber stops
 * building `new THREE.Clock()`. Confirm with
 * `grep -n "new THREE.Clock" node_modules/@react-three/fiber/dist/*.js`.
 * No matches (R3F v10 replaces Clock with Timer) means this shim is no longer needed.
 *
 * @see https://github.com/pmndrs/react-three-fiber/issues/3741
 */
import { setConsoleFunction } from "three";

/**
 * `warn()` prepends `THREE.` to its first argument, and the Clock constructor passes a
 * string that already starts with `THREE.Clock:`, so the message arrives double-prefixed.
 */
const CLOCK_DEPRECATION = "THREE.THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.";

type ConsoleMethod = "log" | "warn" | "error";

/**
 * `setConsoleFunction()` writes to a single global slot, so a hot reload that re-evaluates
 * this module must not install the filter twice.
 */
const INSTALLED = Symbol.for("galerie_de_ruiter.threeConsoleFilter");
type GlobalScope = typeof globalThis & { [INSTALLED]?: boolean };

const scope = globalThis as GlobalScope;

if (!scope[INSTALLED]) {
  scope[INSTALLED] = true;

  setConsoleFunction((method: ConsoleMethod, message: string, ...params: unknown[]) => {
    if (method === "warn" && message === CLOCK_DEPRECATION) {
      return;
    }

    // Mirror three's default handling so TSL warnings/errors keep clickable stack frames.
    if (method !== "log") {
      const first = params[0] as { isStackTrace?: boolean; getError?: (m: string) => Error } | undefined;
      if (first?.isStackTrace && typeof first.getError === "function") {
        console[method](first.getError(message));
        return;
      }
    }

    console[method](message, ...params);
  });
}
