/** @type {import('next').NextConfig} */
const nextConfig = {
  // Samodzielny build - mniejszy obraz Dockera, nie potrzebuje node_modules na serwerze
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
