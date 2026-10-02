import path from "path";
import { fileURLToPath } from "url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import Dotenv from "dotenv-webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    new HtmlWebpackPlugin({
      template: "./index.html",
    }),
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash].css",
    }),
    new Dotenv(),
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
    },
  },

  devtool: "source-map",
};