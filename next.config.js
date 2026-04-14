/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // react-nice-avatar → chroma-js: transpilar evita chunks vendor rotos en dev tras cambios en .next
  transpilePackages: ["react-nice-avatar", "chroma-js"],
};

module.exports = nextConfig;
