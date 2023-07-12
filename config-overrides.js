const {
  override,
  addWebpackAlias,
  fixBabelImports,
  addLessLoader,
  // adjustStyleLoaders,
} = require("customize-cra");
const crypto = require('crypto');

/**
 * The MD4 algorithm is not available anymore in Node.js 17+ (because of library SSL 3).
 * In that case, silently replace MD4 by the MD5 algorithm.
 * 
 * 备注：webpack5.61.0+以上修复了此问题，如升级webpack，则可移除此段代码
 */
try {
  crypto.createHash('md4');
} catch (e) {
  console.warn('Crypto "MD4" is not supported anymore by this Node.js version');
  const origCreateHash = crypto.createHash;
  crypto.createHash = (alg, opts) => {
    return origCreateHash(alg === 'md4' ? 'md5' : alg, opts);
  };
}

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
