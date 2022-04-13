const {
  override,
  addWebpackAlias,
  fixBabelImports,
  addLessLoader,
  // adjustStyleLoaders,
} = require("customize-cra");
const path = require("path");

module.exports = override(
  addWebpackAlias({
    "@": path.resolve(__dirname, "src"),
  }),
  fixBabelImports("import", {
    libraryName: "antd",
    libraryDirectory: "es",
    style: true,
  }),
  addLessLoader({
    lessOptions: {
      javascriptEnabled: true,
      modifyVars: {
        "@primary-color": "#3876ff",
        "@success-color": "#32CFA8",
        "@text-color": "#3A3A3A",
        "@primary-5": "#3876ff",
      },
    },
  })
);
