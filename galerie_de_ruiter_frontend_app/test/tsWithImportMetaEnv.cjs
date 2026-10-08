/**
 * Jest transformer that wraps ts-jest and rewrites `import.meta.env.X` to
 * `process.env.X` before TypeScript compiles the file.
 *
 * The application reads its configuration through `import.meta.env`, which Webpack
 * replaces at build time. Jest runs CommonJS modules, where `import.meta` does not
 * exist, so the source is normalised first and `test/jest.env.ts` fills in the values.
 *
 * ts-jest 29 exposes its factory on the `default` export (`require("ts-jest").default`).
 */
const tsJestModule = require("ts-jest");

const createTsJestTransformer =
  typeof tsJestModule.createTransformer === "function"
    ? tsJestModule.createTransformer
    : tsJestModule.default.createTransformer;

const TS_JEST_CONFIG = {
  tsconfig: {
    target: "ES2022",
    module: "CommonJS",
    moduleResolution: "node",
    jsx: "react-jsx",
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    resolveJsonModule: true,
    skipLibCheck: true,
    isolatedModules: true,
    types: ["jest", "node"],
  },
  // Test runs should not fail on project-wide type errors; `npm run build` owns that.
  diagnostics: { warnOnly: true },
};

const rewrite = (sourceText) => sourceText.replace(/import\.meta\.env/g, "process.env");

function wrap(base) {
  return {
    ...base,
    process(sourceText, sourcePath, options) {
      return base.process(rewrite(sourceText), sourcePath, options);
    },
    processAsync(sourceText, sourcePath, options) {
      const run = base.processAsync
        ? base.processAsync.bind(base)
        : (text, path, opts) => Promise.resolve(base.process(text, path, opts));
      return Promise.resolve(run(rewrite(sourceText), sourcePath, options));
    },
  };
}

module.exports = {
  createTransformer: () => wrap(createTsJestTransformer(TS_JEST_CONFIG)),
};
