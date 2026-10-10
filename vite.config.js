import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const local =
    command === 'serve' && (process.env.VITE_LOCAL_MODE || env.VITE_LOCAL_MODE) === 'true';
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '#seed-data': fileURLToPath(
          new URL(local ? './src/lib/seeds.js' : './src/lib/emptySeeds.js', import.meta.url),
        ),
      },
    },
  };
});
