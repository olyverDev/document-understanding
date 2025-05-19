import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/domains/prescription/index.ts',
    'src/errors/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.js' : '.cjs',
    };
  },
  sourcemap: true,
  clean: true,
  splitting: false,
  target: 'node18',
  loader: {
    '.json': 'json',
  },
});
