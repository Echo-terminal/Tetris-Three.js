import { defineConfig } from "vite";

export default defineConfig(({ command }) => {
  const isProd = command === "build";

  const base = isProd ? "/Tetris-Three.js/" : "/";

  return { base };
});