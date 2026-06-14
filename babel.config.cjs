/** Babel config used only by Jest (via babel-jest) to run the TypeScript tests. */
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
};
