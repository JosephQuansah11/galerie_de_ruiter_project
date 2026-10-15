import path from "path";
import { fileURLToPath } from "url";
import webpack from "webpack";
import CopyPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import Dotenv from "dotenv-webpack";
import { resolveSiteUrl } from "./site.config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The site's public origin, for the social preview tags in index.html, which need absolute URLs,
// for the canonical URL the pages declare (see src/hooks/usePageMeta.ts) and for the sitemap.
// `scripts/generate-sitemap.mjs` reads the same value from site.config.mjs, so the build steps
// cannot drift apart.
const siteUrl = resolveSiteUrl();

export default {
  entry: "./src/index.tsx",

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "js/[name].[contenthash].js",
    publicPath: "/",
    clean: true,
  },

  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: path.resolve(__dirname, "tsconfig.app.json"),
          },
        },
      },
    {
      // Plain stylesheets - a `.css` file from a dependency, say - go through the same extractor
      // as the Sass partials, so every stylesheet of the first paint lands in one file.
      test: /\.css$/i,
      use: [
        MiniCssExtractPlugin.loader,
        "css-loader",
      ],
    },
    {
      test: /\.s[ac]ss$/i,
      use: [
        MiniCssExtractPlugin.loader, // or "style-loader" in development
        {
          // The gallery type lives in public/fonts, which is copied to the site root as it is, so
          // a /fonts/ url is left exactly as written and fetched by the browser. Anything else
          // keeps the default: webpack resolves it and emits the file it points at.
          loader: "css-loader",
          options: { url: { filter: (url) => !url.startsWith("/fonts/") } },
        },
        {
          loader: "sass-loader",
          options: {
            api: "modern-compiler",          // recommended with modern Sass
            sassOptions: {
              // Silence the noisy Bootstrap deprecations
              quietDeps: true,
              silenceDeprecations: [
                "import",
                "global-builtin",
                "color-functions",
                "if-function",  
              ],
            },
          },
        },
      ],
    },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: "asset/resource",
        generator: {
          filename: "images/[name][ext]",
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name][ext]",
        },
      },
    ],
  },

  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "public"),
          to: ".",
          globOptions: {
            ignore: ["**/index.html"],
            // `public/.well-known/` holds the files agents and registries look for by convention
            // (the ARD manifest). A glob skips dot files and dot directories unless it is told
            // otherwise, so without this the manifest is built, published - and missing.
            dot: true,
          },
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: "./index.html",
      // The template turns this into the absolute URLs a crawler needs in the preview tags.
      siteUrl,
    }),
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash].css",
    }),
    new Dotenv({
      prefix: "import.meta.env.",
      systemvars: true,
    }),
    // The canonical URL the pages declare has to name the gallery's own origin rather than the
    // host that happened to serve the page: Render serves this site on its `onrender.com` domain
    // as well, and a canonical built from `window.location.origin` lets that domain declare itself
    // canonical for every page too, which is how a search engine ends up choosing between two
    // copies of the whole site. The value is the same `siteUrl` the template and the sitemap use.
    new webpack.DefinePlugin({
      "import.meta.env.SITE_URL": JSON.stringify(siteUrl),
    }),
  ],

  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    port: 3000,
    historyApiFallback: true,
    hot: true,
    liveReload: true,
    watchFiles: ["src/**/*", "public/**/*"],
    open: true,
    client: {
      overlay: true,
    },
  },

  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        // Every stylesheet the first paint needs lands in one file, so the browser waits on a
        // single render-blocking <link> instead of one per split chunk. Styles that only an
        // on-demand chunk needs (the 3D viewer) keep their own file and travel with it.
        styles: { name: "styles", type: "css/mini-extract", chunks: "initial", enforce: true },
      },
    },
  },

  devtool: "source-map",
};