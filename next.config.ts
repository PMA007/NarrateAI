import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
