/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `output: 'standalone'` keeps the Docker image small (see Dockerfile).
  output: 'standalone',
};

module.exports = nextConfig;
