import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

const peerDeps = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'vue',
  'three',
  'gsap',
];

export default defineConfig({
  plugins: [
    react(),
    vue(),
    dts({
      tsconfigPath: './tsconfig.build.json',
      entryRoot: 'src',
      outDir: 'dist',
      include: ['src'],
      exclude: ['src/**/*.test.ts'],
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        vue: resolve(__dirname, 'src/vue/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => peerDeps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
      output: {
        entryFileNames: '[name].js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
