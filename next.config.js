const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // react-nice-avatar → chroma-js: transpilar evita chunks vendor rotos en dev tras cambios en .next
  transpilePackages: ["react-nice-avatar", "chroma-js"],
  webpack: (config) => {
    // El entry ESM de react-nice-avatar importa chroma-js sin default export (v2+).
    // Forzar el build CJS evita que el avatar falle en el cliente y quede en gris.
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-nice-avatar": path.resolve(__dirname, "node_modules/react-nice-avatar/dist/index.js"),
    };
    return config;
  },
};

module.exports = nextConfig;
