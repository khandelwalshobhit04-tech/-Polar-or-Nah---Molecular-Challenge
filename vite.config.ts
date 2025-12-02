import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Safely replace process.env.API_KEY with the environment variable during build
      // Default to empty string if undefined to prevent JSON.stringify(undefined) issues
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Define 'process.env' object to prevent crashes if third-party libs try to access it
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
    }
  };
});