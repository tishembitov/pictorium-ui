import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Plugins
    plugins: [
      react(),
    ],

    // Path Aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/app': path.resolve(__dirname, './src/app'),
        '@/modules': path.resolve(__dirname, './src/modules'),
        '@/pages': path.resolve(__dirname, './src/pages'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@/assets': path.resolve(__dirname, './src/assets'),
        '@/styles': path.resolve(__dirname, './src/styles'),
      },
    },

    // Development Server
    server: {
      port: 3000,
      host: true,
      open: true,
      cors: true,
      
      // Proxy API requests to gateway (optional, for development)
      proxy: {
        '/api': {
          target: env.VITE_API_GATEWAY_URL || 'http://localhost:8222',
          changeOrigin: true,
          secure: false,
        },
      },
      
      // HMR settings
      hmr: {
        overlay: true,
      },
    },

    // Preview Server (for production build preview)
    preview: {
      port: 3000,
      host: true,
      open: true,
    },

    // Build Options
    build: {
      target: 'ES2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'esbuild' : false,
      
      // Chunk splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-gestalt': ['gestalt', 'gestalt-datepicker'],
            'vendor-utils': ['axios', 'zustand', 'date-fns'],
            'vendor-auth': ['keycloak-js'],
          },
          // Asset file naming
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const fileName = assetInfo.names?.[0] || assetInfo.name || '';
            
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(fileName)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(fileName)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            if (/\.css$/i.test(fileName)) {
              return 'assets/css/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1000, // 1MB
      
      // CSS code splitting
      cssCodeSplit: true,
    },

    // CSS Options
    css: {
      devSourcemap: true,
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: mode === 'production' 
          ? '[hash:base64:8]' 
          : '[name]__[local]__[hash:base64:5]',
      },
    },

    // Optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'gestalt',
        'axios',
        'zustand',
        'keycloak-js',
        'date-fns',
      ],
      exclude: [],
    },

    // Environment Variables
    envPrefix: 'VITE_',

    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    // ESBuild options
    esbuild: {
      // Drop console and debugger in production
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },
  };
});