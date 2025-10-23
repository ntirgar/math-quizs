// Use direct vitest import to avoid module resolution issues during Next build
// @ts-expect-error vitest types may not be loaded in Next build environment
import { defineConfig } from 'vitest';
export default defineConfig({
  test: {
    environment: 'node'
  }
});
