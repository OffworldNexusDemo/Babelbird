import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        svelte({
            compilerOptions: {
                // Inject styles into JS for Shadow DOM
                css: "injected",
            },
        }),
    ],
    build: {
        cssCodeSplit: false,
        rollupOptions: {
            input: {
                babelbird: resolve(__dirname, "src/content.ts"),
                "babelbird-bg": resolve(__dirname, "src/background.ts"),
            },
            output: {
                entryFileNames: "[name].js",
                assetFileNames: "[name].[ext]",
                chunkFileNames: "chunks/[name]-[hash].js",
            },
        },
    },
});
