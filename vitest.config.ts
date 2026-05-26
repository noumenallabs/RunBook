import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 55,
        branches: 45,
        functions: 40,
        lines: 55,
      },
      include: ['src/**/*'],
      exclude: [
        'src/test/**/*',
        'src/main.tsx',
        'vite-env.d.ts',
        'src/app/components/ui/**/*',
        'src/app/components/figma/**/*',
        'src/styles/**/*',
        'src/app/components/cricket/PointsTable.tsx',
        'src/app/components/cricket/Scorecard.tsx',
        'src/app/components/cricket/data.ts',
        'src/app/components/cricket/match.tsx',
        'src/engine/validation.ts',
        'src/db/matchStore.ts',
      ],
    },
  },
});
