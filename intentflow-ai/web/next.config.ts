import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence "multiple lockfiles" / workspace root warning
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
