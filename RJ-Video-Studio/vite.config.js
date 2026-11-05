import { defineConfig } from 'vite';

export default defineConfig({
  // Keep @ffmpeg/ffmpeg out of dependency pre-bundling so Vite can
  // resolve and serve its module worker correctly in development.
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg']
  }
});
