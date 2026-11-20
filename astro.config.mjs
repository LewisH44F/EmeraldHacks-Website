// astro.config.mjs — the main settings file for Astro (the tool that turns my source files into the static site).
// It connects Tailwind to the build. Netlify reads the output folder from netlify.toml, not from here.
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // TODO: swap in the real Netlify URL (or custom domain) once it exists.
  // Astro uses this to build absolute URLs for Open Graph images and the canonical link.
  site: "https://emeraldcanhack.netlify.app",

  // I leave output as the default ("static") on purpose: every page is plain HTML generated at build time,
  // so Netlify needs no server adapter and there's no backend to secure.

  vite: {
    // Tailwind v4 plugs into Vite (the bundler Astro uses under the hood) instead of needing its own config file.
    plugins: [tailwindcss()],
  },
});
