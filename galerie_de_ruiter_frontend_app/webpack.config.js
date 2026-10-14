import path from "path";
import { fileURLToPath } from "url";
import CopyPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import Dotenv from "dotenv-webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The site's public origin. `scripts/generate-sitemap.mjs` builds the sitemap and the robots
// `Sitemap:` line from it, and the social preview tags in index.html need absolute URLs.
const siteUrl = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

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
      "@images": path.resolve(__dirname, "src/images"),
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
      // Plain stylesheets (the entry's index.css) go through the same extractor as the Sass
      // partials, so every stylesheet of the first paint lands in one render-blocking file.
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
        "css-loader",
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