/**
 * Jest configuration for the Galerie de Ruiter frontend.
 *
 * The application is bundled by Webpack today; this configuration lets the page
 * components be exercised in jsdom without a bundler. `test/tsWithImportMetaEnv.cjs`
 * rewrites `import.meta.env` reads so the same source runs under CommonJS.
 */
module.exports = {
  rootDir: __dirname,
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],
  transform: {
    "^.+\\.(ts|tsx)$": ["<rootDir>/test/tsWithImportMetaEnv.cjs", {}],
  },
  moduleNameMapper: {
    // Order matters: asset and stylesheet patterns are matched before the "@/" alias,
    // otherwise `@/styles/App.scss` would resolve to the real Sass file.
    "\\.(css|scss|sass)$": "<rootDir>/test/styleMock.cjs",
    "\\.(png|jpe?g|gif|svg|webp|ico)$": "<rootDir>/test/fileMock.cjs",
    "^three$": "<rootDir>/test/stubs/three.cjs",
    "^three/(.*)$": "<rootDir>/test/emptyMock.cjs",
    "^@react-three/fiber$": "<rootDir>/test/emptyMock.cjs",
    "^@react-three/drei$": "<rootDir>/test/emptyMock.cjs",
    "^@google/model-viewer$": "<rootDir>/test/emptyMock.cjs",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/test/jest.env.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts", "<rootDir>/test/jest.mocks.ts"],
  clearMocks: true,
  testTimeout: 20000,
  verbose: false,
};
