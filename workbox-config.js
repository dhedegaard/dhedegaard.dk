module.exports = {
  globDirectory: "out/",
  globPatterns: ["**/*.{js,html,png,json,txt}"],
  globIgnores: ["404.html", "500.html", "index.html"],
  swDest: "out/sw.js",
  inlineWorkboxRuntime: true,
  skipWaiting: true,
  clientsClaim: true,
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
};
