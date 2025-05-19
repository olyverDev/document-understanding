import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/?(*.)test.ts',
    '**/?(*.)integration.test.ts',
  ],
  moduleNameMapper: {
    '^document-understanding$': '<rootDir>/dist/index.js',
  },
  setupFiles: ['<rootDir>/tests/jest.setup.ts'],
};

export default config;
