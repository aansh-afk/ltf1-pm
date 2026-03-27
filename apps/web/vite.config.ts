import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd() + '/../../', '')
  
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ltf1/backend': path.resolve(__dirname, '../../packages/backend'),
      '@convex': path.resolve(__dirname, '../../convex'),
    },
  },
  optimizeDeps: {
    include: ['@ltf1/backend'],
  },
  server: {
    port: 3000,
    open: true,
  },
  envDir: '../../',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'clerk': ['@clerk/clerk-react'],
          'convex': ['convex', 'convex/react'],
          'animation': ['framer-motion'],
          'blocknote': ['@blocknote/core', '@blocknote/react', '@blocknote/mantine'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  }
})