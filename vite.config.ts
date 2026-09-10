
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        parserOpts: {
          plugins: ['decorators-legacy', 'classProperties']
        }
      }
    }),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY || ''),
    'process.env': JSON.stringify({
      NODE_ENV: process.env.NODE_ENV || 'development',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      API_KEY: process.env.GEMINI_API_KEY || process.env.API_KEY || ''
    })
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'lucide-react',
      '@google/genai',
      '@nozbe/watermelondb',
      '@nozbe/watermelondb/adapters/lokijs',
      '@nozbe/watermelondb/decorators'
    ]
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  }
});
