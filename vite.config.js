import { defineConfig } from "vite";

export default defineConfig(({ command }) => {
  const isProd = command === "build";

  const base = isProd ? "/wed-tetris-3d/" : "/";

  return { base };
});