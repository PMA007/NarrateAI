import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable the dev-mode indicator (small Next.js logo overlay) so it
  // doesn't appear in Puppeteer screenshots during server-side rendering.
  devIndicators: false,

  // puppeteer uses native Node.js require() with an embedded Chromium binary.
  // Turbopack/webpack cannot bundle it — must be treated as a server external.
  serverExternalPackages: [
    'puppeteer',
    'puppeteer-core',
    'fluent-ffmpeg',
    '@ffmpeg-installer/ffmpeg'
  ],
};

export default nextConfig;
