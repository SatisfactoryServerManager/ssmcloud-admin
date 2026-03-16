import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "VITE_");
    const target = env.VITE_ADMIN_API_TARGET || "http://localhost:3001";

    return {
        plugins: [vue()],
        server: {
            proxy: {
                "/api": {
                    target,
                    changeOrigin: true,
                },
                "/auth": {
                    target,
                    changeOrigin: true,
                },
            },
        },
    };
});
