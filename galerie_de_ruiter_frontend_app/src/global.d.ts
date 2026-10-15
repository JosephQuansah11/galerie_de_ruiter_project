// Stylesheets are imported for their side effect: webpack's extractor turns them into the site's
// one stylesheet, so the module itself exports nothing. TypeScript still has to be told the shape
// of such an import, which is all this file is for. Images are not imported as modules - the
// gallery refers to them by their path under public/ - so there are no declarations for them.
declare module "*.scss" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
