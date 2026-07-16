import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
    base: "/LessonPlanPowerfullyDone/",
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ["react", "react-dom", "react-router-dom"],
                    animation: ["framer-motion"],
                    pdf: ["html2pdf.js"]
                }
            }
        }
    },
    server: {
        host: "127.0.0.1",
        port: 5173
    }
});
