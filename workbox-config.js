module.exports = {
  globDirectory: "out/",
  globPatterns: ["**/*.{js,html,png,json,txt}"],
  globIgnores: ["404.html"],
  swDest: "out/sw.js",
  inlineWorkboxRuntime: true,
  skipWaiting: true,
  clientsClaim: true,
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
};
