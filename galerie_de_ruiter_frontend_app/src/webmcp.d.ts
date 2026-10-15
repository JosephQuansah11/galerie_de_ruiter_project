/**
 * The WebMCP declarative annotations, from the origin trial Chrome documents at
 * https://developer.chrome.com/docs/ai/webmcp/declarative-api. A form carrying `toolname` and
 * `tooldescription` becomes a tool an agent can find, and each control's `name` plus
 * `toolparamdescription` becomes one of that tool's parameters. React passes an unknown lowercase
 * attribute through to the DOM untouched, so nothing has to change at the call site - but
 * TypeScript knows no such attribute on a `<form>`, and it is stricter than React. Declaring them
 * once here is what keeps the annotations on the forms instead of behind a cast at every use.
 *
 * They are annotations and nothing more: no script, no event handler, no policy change. A form
 * without `toolautosubmit` is filled in by the agent and then handed back to the visitor to check
 * and submit, which is what the gallery's own forms want.
 *
 * The empty export is not decoration. In a file with no import or export, `declare module "react"`
 * is read as the declaration of a *new* module of that name, which replaces React's types with the
 * two interfaces below - every `useState` in the project then reports as missing. Exporting
 * something makes this a module, and a module's `declare module "react"` merges into the real one.
 */
export {};

declare module "react" {
  interface FormHTMLAttributes<T> {
    /** The tool's name, as an agent sees it. */
    toolname?: string;
    /** What invoking the tool does, for an agent choosing between tools. */
    tooldescription?: string;
    /** Lets an agent submit the filled-in form without the visitor checking it first. */
    toolautosubmit?: boolean;
  }
  interface InputHTMLAttributes<T> {
    /** What one parameter of the tool is for, for the agent filling it in. */
    toolparamdescription?: string;
  }
  interface TextareaHTMLAttributes<T> {
    /** What one parameter of the tool is for, for the agent filling it in. */
    toolparamdescription?: string;
  }
  interface SelectHTMLAttributes<T> {
    /** What one parameter of the tool is for, for the agent filling it in. */
    toolparamdescription?: string;
  }
}
