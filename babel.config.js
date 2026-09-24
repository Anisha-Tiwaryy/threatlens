module.exports = {
  presets: [
    ["@babel/preset-env", { targets: "> 0.5%, last 2 versions, not dead" }],
    // development:false forces the production JSX runtime (jsx), which works with every React build.
    ["@babel/preset-react", { runtime: "automatic", development: false }],
  ],
};
