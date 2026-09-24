// Hand-written Webpack 5 config (no create-react-app / Vite) so every build step is explicit.
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env, argv) => {
  const isProd = argv.mode === "production";

  // Shared loader chain for Sass. CSS Modules are switched on only for *.module.scss,
  // so global BEM styles and scoped component styles can live side by side.
  const styleLoader = isProd ? MiniCssExtractPlugin.loader : "style-loader";

  return {
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProd ? "js/[name].[contenthash:8].js" : "js/[name].js",
      chunkFilename: isProd ? "js/[name].[contenthash:8].chunk.js" : "js/[name].chunk.js",
      publicPath: "auto", // relative asset URLs, so the build also works under github.io/threatlens/
      clean: true,
    },
    resolve: { extensions: [".js", ".jsx"] },
    devtool: isProd ? "source-map" : "eval-cheap-module-source-map",
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: "babel-loader", // transpiles ES2020+ and JSX using babel.config.js
        },
        {
          test: /\.module\.scss$/,
          use: [
            styleLoader,
            {
              loader: "css-loader",
              options: {
                modules: {
                  localIdentName: isProd ? "[hash:base64:6]" : "[name]__[local]--[hash:base64:4]",
                  namedExport: false, // keep `import styles from "./X.module.scss"`
                  exportLocalsConvention: "as-is",
                },
                importLoaders: 1,
              },
            },
            "sass-loader",
          ],
        },
        {
          test: /\.scss$/,
          exclude: /\.module\.scss$/,
          use: [styleLoader, "css-loader", "sass-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: "./public/index.html" }),
      ...(isProd ? [new MiniCssExtractPlugin({ filename: "css/[name].[contenthash:8].css" })] : []),
    ],
    optimization: {
      runtimeChunk: "single", // small runtime chunk so app changes do not bust the vendor cache
      // Split React/ReactDOM into their own long-cached vendor chunk.
      splitChunks: {
        cacheGroups: {
          vendor: { test: /[\\/]node_modules[\\/]/, name: "vendor", chunks: "all" },
        },
      },
    },
    devServer: { historyApiFallback: true, port: 3000, hot: true, open: false },
    performance: { hints: isProd ? "warning" : false },
  };
};
